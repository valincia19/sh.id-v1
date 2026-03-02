import pool from "../../db/postgres.js";

/**
 * Bulk find or create tags and return their IDs.
 */
export const bulkFindOrCreateTags = async (tagNames) => {
    if (!tagNames || tagNames.length === 0) return [];

    // Clean and deduplicate tags
    const cleanTags = [...new Set(tagNames.map(name => {
        const trimmed = name.trim().toLowerCase();
        const slug = trimmed
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return { name: trimmed, slug };
    }))].filter(t => t.name);

    if (cleanTags.length === 0) return [];

    const resultTags = [];

    // We can't easily bulk ON CONFLICT return all (only inserted/updated),
    // so we'll just insert what we can, and then SELECT all by slug.

    // 1. Bulk insert with ON CONFLICT DO NOTHING
    const values = [];
    const placeholders = [];
    let i = 1;
    for (const tag of cleanTags) {
        placeholders.push(`($${i++}, $${i++})`);
        values.push(tag.name, tag.slug);
    }

    const insertQuery = `
        INSERT INTO tags (name, slug) 
        VALUES ${placeholders.join(", ")} 
        ON CONFLICT (slug) DO NOTHING
    `;

    await pool.query(insertQuery, values);

    // 2. Select all those tags back to get their IDs
    const slugs = cleanTags.map(t => t.slug);
    const selectQuery = `SELECT * FROM tags WHERE slug = ANY($1::text[])`;
    const selectResult = await pool.query(selectQuery, [slugs]);

    return selectResult.rows;
};

/**
 * Set tags for a script (replace all existing tags)
 * Optimized to use bulk operations and transactions.
 */
export const setScriptTags = async (scriptId, tagNames) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Clear existing tags
        await client.query("DELETE FROM script_tags WHERE script_id = $1", [scriptId]);

        if (!tagNames || tagNames.length === 0) {
            await client.query("COMMIT");
            return [];
        }

        // 2. Bulk Find or create all tags
        // This still uses the pool (which is fine), but we could pass the client if needed.
        // For simplicity and to avoid deadlocks or connection exhaustion, we'll just await the bulk pool func.
        // Actually, let's inline a slightly modified version to use the transaction client.

        const cleanTags = [...new Set(tagNames.map(name => {
            const trimmed = name.trim().toLowerCase();
            const slug = trimmed
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");
            return { name: trimmed, slug };
        }))].filter(t => t.name);

        if (cleanTags.length === 0) {
            await client.query("COMMIT");
            return [];
        }

        const values = [];
        const placeholders = [];
        let i = 1;
        for (const tag of cleanTags) {
            placeholders.push(`($${i++}, $${i++})`);
            values.push(tag.name, tag.slug);
        }

        const insertQuery = `
            INSERT INTO tags (name, slug) 
            VALUES ${placeholders.join(", ")} 
            ON CONFLICT (slug) DO NOTHING
        `;
        await client.query(insertQuery, values);

        const slugs = cleanTags.map(t => t.slug);
        const selectQuery = `SELECT * FROM tags WHERE slug = ANY($1::text[])`;
        const tagsResult = await client.query(selectQuery, [slugs]);
        const tags = tagsResult.rows;

        // 3. Bulk Insert into script_tags
        if (tags.length > 0) {
            const stValues = [];
            const stPlaceholders = [];
            let j = 1;

            for (const tag of tags) {
                stPlaceholders.push(`($${j++}, $${j++})`);
                stValues.push(scriptId, tag.id);
            }

            const insertStQuery = `
                INSERT INTO script_tags (script_id, tag_id) 
                VALUES ${stPlaceholders.join(", ")} 
                ON CONFLICT DO NOTHING
            `;
            await client.query(insertStQuery, stValues);
        }

        await client.query("COMMIT");
        return tags;

    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

/**
 * Get tags for a script
 */
export const getTagsByScriptId = async (scriptId) => {
    const query = `
        SELECT t.* FROM tags t
        INNER JOIN script_tags st ON st.tag_id = t.id
        WHERE st.script_id = $1
        ORDER BY t.name ASC
    `;
    const result = await pool.query(query, [scriptId]);
    return result.rows;
};

/**
 * Get tags for multiple scripts (bulk fetch to fix N+1)
 */
export const getTagsForScriptIds = async (scriptIds) => {
    if (!scriptIds || scriptIds.length === 0) return [];

    // We select script_id so we can group them in memory
    const query = `
        SELECT t.*, st.script_id FROM tags t
        INNER JOIN script_tags st ON st.tag_id = t.id
        WHERE st.script_id = ANY($1::uuid[])
        ORDER BY t.name ASC
    `;
    const result = await pool.query(query, [scriptIds]);
    return result.rows;
};

/**
 * Get all tags
 */
export const getAllTags = async () => {
    const result = await pool.query("SELECT * FROM tags ORDER BY name ASC");
    return result.rows;
};

/**
 * Search tags by name
 */
export const searchTags = async (query) => {
    const result = await pool.query(
        "SELECT * FROM tags WHERE name ILIKE $1 ORDER BY name ASC LIMIT 10",
        [`%${query}%`]
    );
    return result.rows;
};
