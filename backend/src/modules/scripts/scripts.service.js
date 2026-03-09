import pool from "../../db/postgres.js";
import { transaction } from "../../db/postgres.js";
import crypto from "crypto";
import config from "../../config/index.js";

/**
 * Generate a random slug for scripts
 */
const generateRandomSlug = () => {
    return crypto.randomBytes(8).toString("hex");
};

/**
 * Create a new script
 */
export const createScript = async (scriptData) => {
    const {
        title, description, thumbnailUrl, loaderUrl, hubId, gameId, ownerId,
        hasKeySystem, keySystemUrl, isPaid, purchaseUrl, status, youtubeUrl
    } = scriptData;
    const slug = generateRandomSlug();
    const finalStatus = status || 'draft'; // Default to draft if not specified

    let finalKeySystemUrl = keySystemUrl;
    if (finalKeySystemUrl === 'scripthub') {
        finalKeySystemUrl = `${config.getkeyUrl}/${slug}`;
    }

    const query = `
    INSERT INTO scripts (
        title, slug, description, thumbnail_url, loader_url, hub_id, game_id, owner_id, status,
        has_key_system, key_system_url, is_paid, purchase_url, youtube_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
    `;

    const values = [
        title, slug, description, thumbnailUrl, loaderUrl, hubId || null, gameId || null, ownerId, finalStatus,
        hasKeySystem || false, finalKeySystemUrl || null, isPaid || false, purchaseUrl || null, youtubeUrl || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Check if slug exists
 */
export const checkSlugExists = async (slug) => {
    const query = "SELECT id FROM scripts WHERE slug = $1";
    const result = await pool.query(query, [slug]);
    return result.rows.length > 0;
};

/**
 * Get scripts by owner ID (with game info)
 */
export const getScriptsByOwner = async (ownerId, { page = 1, limit = 50 } = {}) => {
    const offset = (page - 1) * limit;
    const query = `
        SELECT s.*, g.name as game_name, g.slug as game_slug, g.logo_url as game_logo_url
        FROM scripts s
        LEFT JOIN games g ON s.game_id = g.id
        WHERE s.owner_id = $1 AND s.deleted_at IS NULL
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [ownerId, limit, offset]);
    return result.rows;
};

/**
 * Get scripts by hub ID
 */
export const getScriptsByHub = async (hubId, { page = 1, limit = 30 } = {}) => {
    const offset = (page - 1) * limit;
    const query = `
        SELECT s.*, g.name as game_name, g.slug as game_slug, g.logo_url as game_logo_url
        FROM scripts s
        LEFT JOIN games g ON s.game_id = g.id
        WHERE s.hub_id = $1 AND s.status = 'published' AND s.deleted_at IS NULL
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [hubId, limit, offset]);
    return result.rows;
};

/**
 * Get script by ID
 */
export const getScriptById = async (id) => {
    const query = `
        SELECT s.*, 
               g.name as game_name, g.slug as game_slug, g.logo_url as game_logo_url, g.game_platform_id,
               h.name as hub_name
        FROM scripts s
        LEFT JOIN games g ON s.game_id = g.id
        LEFT JOIN hubs h ON s.hub_id = h.id
        WHERE s.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

/**
 * Get script by slug (publicly available info)
 */
export const getScriptBySlug = async (slug, userId = null) => {
    let selectLikeStatus = "";
    // Always pass userId as $2 for the visibility check and like status
    const params = [slug, userId];

    if (userId) {
        selectLikeStatus = `, (SELECT EXISTS(SELECT 1 FROM script_likes WHERE script_id = s.id AND user_id = $2)) as is_liked`;
    }

    // Determine if the input looks like a UUID to avoid index-breaking ::text cast
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const whereClause = isUUID
        ? `WHERE (s.slug = $1 OR s.id = $1::uuid)`
        : `WHERE s.slug = $1`;

    const query = `
    SELECT s.*, u.username as owner_username, u.display_name as owner_display_name, 
           u.avatar_url as owner_avatar_url,
           h.name as hub_name, h.slug as hub_slug, h.logo_url as hub_logo_url,
           g.name as game_name, g.slug as game_slug, g.logo_url as game_logo_url, g.banner_url as game_banner_url,
           (SELECT COUNT(*) FROM script_comments WHERE script_id = s.id) as comments_count
           ${selectLikeStatus}
    FROM scripts s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN hubs h ON s.hub_id = h.id
    LEFT JOIN games g ON s.game_id = g.id
    ${whereClause}
    AND (s.status = 'published' OR ($2::uuid IS NOT NULL AND s.owner_id = $2))
    AND s.deleted_at IS NULL
    `;
    const result = await pool.query(query, params);
    return result.rows[0];
};

/**
 * Get all published scripts (with optional filtering by tag or query)
 * Supports pagination via page & limit
 */
export const getAllPublishedScripts = async (filters = {}) => {
    const { tag, query, userId, hubId, sortBy, seed, page = 1, limit = 30 } = filters;
    const whereParams = [];
    let paramIndex = 1;

    let filterClause = "";

    if (hubId) {
        filterClause += ` AND s.hub_id = $${paramIndex}`;
        whereParams.push(hubId);
        paramIndex++;
    }

    if (tag) {
        filterClause += ` AND EXISTS (
            SELECT 1 FROM script_tags st 
            JOIN tags t ON st.tag_id = t.id 
            WHERE st.script_id = s.id AND (t.name = $${paramIndex} OR t.slug = $${paramIndex})
        )`;
        whereParams.push(tag);
        paramIndex++;
    }

    if (query) {
        filterClause += ` AND s.title ILIKE $${paramIndex}`;
        whereParams.push(`%${query}%`);
        paramIndex++;
    }

    const whereClause = `WHERE s.status = 'published' AND s.deleted_at IS NULL ${filterClause}`;

    // Count total (uses only whereParams)
    const countSql = `SELECT COUNT(*) FROM scripts s ${whereClause}`;
    const countResult = await pool.query(countSql, whereParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Prepare SELECT query params
    const selectParams = [...whereParams];
    let selectLikeStatus = "";

    if (userId) {
        selectLikeStatus = `, (SELECT EXISTS(SELECT 1 FROM script_likes WHERE script_id = s.id AND user_id = $${paramIndex})) as is_liked`;
        selectParams.push(userId);
        paramIndex++;
    }

    // Fetch page
    const offset = (page - 1) * limit;

    let orderClause = "ORDER BY s.created_at DESC";
    if (sortBy === 'random') {
        // Use md5 hash of script ID combined with a seed to provide consistently randomized pagination
        const seedValue = seed || new Date().toISOString().split('T')[0];
        orderClause = `ORDER BY md5(s.id::text || $${paramIndex})`;
        selectParams.push(seedValue);
        paramIndex++;
    }

    selectParams.push(limit, offset);

    const sql = `
    SELECT s.*, u.username as owner_username, u.display_name as owner_display_name, h.name as hub_name,
           g.name as game_name, g.slug as game_slug, g.logo_url as game_logo_url
           ${selectLikeStatus}
    FROM scripts s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN hubs h ON s.hub_id = h.id
    LEFT JOIN games g ON s.game_id = g.id
    ${whereClause}
    ${orderClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await pool.query(sql, selectParams);
    return { rows: result.rows, total };
};

/**
 * Get trending scripts (sorted by popularity within a time window)
 */
export const getTrendingScripts = async ({ period = 'week', userId = null, limit = 30 } = {}) => {
    const params = [];
    let paramIndex = 1;
    let selectLikeStatus = "";
    let dateFilter = "";

    if (userId) {
        selectLikeStatus = `, (SELECT EXISTS(SELECT 1 FROM script_likes WHERE script_id = s.id AND user_id = $${paramIndex})) as is_liked`;
        params.push(userId);
        paramIndex++;
    }

    // Time window filter
    const intervals = { today: '1 day', week: '7 days', month: '30 days' };
    if (intervals[period]) {
        dateFilter = ` AND s.created_at >= NOW() - INTERVAL '${intervals[period]}'`;
    }

    const sql = `
    SELECT s.*, u.username as owner_username, u.display_name as owner_display_name,
           h.name as hub_name,
           g.name as game_name, g.slug as game_slug, g.logo_url as game_logo_url
           ${selectLikeStatus}
    FROM scripts s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN hubs h ON s.hub_id = h.id
    LEFT JOIN games g ON s.game_id = g.id
    WHERE s.status = 'published' AND s.deleted_at IS NULL ${dateFilter}
    ORDER BY (s.views + s.likes * 3) DESC, s.created_at DESC
    LIMIT $${paramIndex}
    `;
    params.push(limit);
    const result = await pool.query(sql, params);
    return result.rows;
};

/**
 * Increment view count
 */
export const incrementViews = async (id) => {
    const query = "UPDATE scripts SET views = views + 1 WHERE id = $1 RETURNING views";
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

/**
 * Increment copy count
 */
export const incrementCopies = async (id) => {
    const query = "UPDATE scripts SET copies = copies + 1 WHERE id = $1 RETURNING copies";
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

/**
 * Increment like count
 */
export const incrementLikes = async (id) => {
    const query = "UPDATE scripts SET likes = likes + 1 WHERE id = $1 RETURNING likes";
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

/**
 * Update a script
 */
export const updateScript = async (id, updateData) => {
    const {
        title, slug, description, thumbnailUrl, loaderUrl, gameId, hubId,
        hasKeySystem, keySystemUrl, isPaid, purchaseUrl, status, youtubeUrl
    } = updateData;

    let finalKeySystemUrl = keySystemUrl;
    if (finalKeySystemUrl === 'scripthub') {
        const scriptRes = await pool.query('SELECT slug FROM scripts WHERE id = $1', [id]);
        if (scriptRes.rows.length > 0) {
            finalKeySystemUrl = `${config.getkeyUrl}/${scriptRes.rows[0].slug}`;
        }
    }

    const setClause = [];
    const values = [id];
    let paramIndex = 2;

    const addParam = (field, value) => {
        if (value !== undefined) {
            setClause.push(`${field} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    };

    addParam('title', title);
    addParam('slug', slug);
    addParam('description', description);
    addParam('thumbnail_url', thumbnailUrl);
    addParam('loader_url', loaderUrl);
    addParam('game_id', gameId);
    addParam('hub_id', hubId);
    addParam('has_key_system', hasKeySystem);
    addParam('key_system_url', finalKeySystemUrl);
    addParam('is_paid', isPaid);
    addParam('purchase_url', purchaseUrl);
    addParam('status', status);
    addParam('youtube_url', youtubeUrl);

    if (setClause.length === 0) return null;

    const query = `
        UPDATE scripts 
        SET ${setClause.join(", ")}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Soft delete a script (set deleted_at timestamp)
 */
export const softDeleteScript = async (id) => {
    const query = `
        UPDATE scripts SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

/**
 * Record a view (unique per IP per script per day)
 * Returns true if the view was counted, false otherwise
 */
export const recordView = async (scriptId, ipAddress) => {
    // Check if this IP already viewed this script today (using UTC date to match index)
    const checkQuery = `
        SELECT id FROM script_views 
        WHERE script_id = $1 AND ip_address = $2 AND (viewed_at AT TIME ZONE 'UTC')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date
        LIMIT 1
    `;
    const existing = await pool.query(checkQuery, [scriptId, ipAddress]);

    if (existing.rows.length > 0) {
        return false; // Already viewed today
    }

    // Insert new view record
    await pool.query(
        `INSERT INTO script_views (script_id, ip_address) VALUES ($1, $2)`,
        [scriptId, ipAddress]
    );

    // Increment views count on scripts table
    await pool.query("UPDATE scripts SET views = views + 1 WHERE id = $1", [scriptId]);
    return true;
};

/**
 * Toggle like for a script
 */
export const toggleLike = async (scriptId, userId) => {
    // Wrapped in transaction to prevent race conditions desyncing the likes counter
    return await transaction(async (client) => {
        const checkQuery = "SELECT id FROM script_likes WHERE script_id = $1 AND user_id = $2";
        const checkResult = await client.query(checkQuery, [scriptId, userId]);

        if (checkResult.rows.length > 0) {
            // Unlike
            await client.query("DELETE FROM script_likes WHERE script_id = $1 AND user_id = $2", [scriptId, userId]);
            await client.query("UPDATE scripts SET likes = GREATEST(likes - 1, 0) WHERE id = $1", [scriptId]);
            return { isLiked: false };
        } else {
            // Like
            await client.query("INSERT INTO script_likes (script_id, user_id) VALUES ($1, $2)", [scriptId, userId]);
            await client.query("UPDATE scripts SET likes = likes + 1 WHERE id = $1", [scriptId]);
            return { isLiked: true };
        }
    });
};

/**
 * Get comments for a script
 */
export const getComments = async (scriptId) => {
    // Fetch all comments for the script and let frontend structure threads
    const query = `
         SELECT c.*, u.username, u.display_name, u.avatar_url
        FROM script_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.script_id = $1
        ORDER BY c.created_at ASC
    `;

    const result = await pool.query(query, [scriptId]);
    return result.rows;
};

/**
 * Post a comment
 */
export const postComment = async (scriptId, userId, content, parentId = null) => {
    const query = `
        INSERT INTO script_comments (script_id, user_id, content, parent_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const result = await pool.query(query, [scriptId, userId, content, parentId]);
    return result.rows[0];
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId, userId) => {
    // Check ownership or admin/mod rights (handled in controller usually, but safe to add ownership check here if passed)
    const query = `
        DELETE FROM script_comments 
        WHERE id = $1 AND (
            user_id = $2 OR 
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = $2 AND r.name IN ('admin', 'moderator')
            )
        )
        RETURNING id
    `;
    const result = await pool.query(query, [commentId, userId]);
    return result.rows[0];
};

