--
-- PostgreSQL database dump
--

\restrict mE1PWO1UjyFkcOCn92KTcfaIQ0WChvC9lzTaKPTIfTc3kiU3fD9rpDB4A2XV6Mg

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: executor_status; Type: TYPE; Schema: public; Owner: scripthub_user
--

CREATE TYPE public.executor_status AS ENUM (
    'pending',
    'active',
    'rejected',
    'archived'
);


ALTER TYPE public.executor_status OWNER TO scripthub_user;

--
-- Name: hub_status; Type: TYPE; Schema: public; Owner: scripthub_user
--

CREATE TYPE public.hub_status AS ENUM (
    'active',
    'pending',
    'suspended',
    'deleted'
);


ALTER TYPE public.hub_status OWNER TO scripthub_user;

--
-- Name: key_status; Type: TYPE; Schema: public; Owner: scripthub_user
--

CREATE TYPE public.key_status AS ENUM (
    'active',
    'expired',
    'revoked',
    'unused'
);


ALTER TYPE public.key_status OWNER TO scripthub_user;

--
-- Name: key_type; Type: TYPE; Schema: public; Owner: scripthub_user
--

CREATE TYPE public.key_type AS ENUM (
    'lifetime',
    'timed',
    'device_locked'
);


ALTER TYPE public.key_type OWNER TO scripthub_user;

--
-- Name: monetization_provider; Type: TYPE; Schema: public; Owner: scripthub_user
--

CREATE TYPE public.monetization_provider AS ENUM (
    'workink',
    'linkvertise',
    'official'
);


ALTER TYPE public.monetization_provider OWNER TO scripthub_user;

--
-- Name: plan_type; Type: TYPE; Schema: public; Owner: scripthub_user
--

CREATE TYPE public.plan_type AS ENUM (
    'free',
    'pro',
    'enterprise',
    'custom'
);


ALTER TYPE public.plan_type OWNER TO scripthub_user;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: scripthub_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO scripthub_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    resource_type character varying(50),
    resource_id uuid,
    ip_address inet,
    user_agent text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO scripthub_user;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.audit_logs IS 'System audit trail';


--
-- Name: auth_providers; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.auth_providers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    provider_user_id character varying(255) NOT NULL,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    provider_data jsonb,
    linked_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT auth_providers_provider_check CHECK (((provider)::text = ANY ((ARRAY['email'::character varying, 'discord'::character varying, 'google'::character varying, 'github'::character varying])::text[])))
);


ALTER TABLE public.auth_providers OWNER TO scripthub_user;

--
-- Name: TABLE auth_providers; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.auth_providers IS 'OAuth and authentication provider linking';


--
-- Name: deployments; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.deployments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    deploy_key character varying(64) NOT NULL,
    s3_key text NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    mime_type character varying(100) DEFAULT 'text/plain'::character varying,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cdn_requests bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.deployments OWNER TO scripthub_user;

--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.email_verifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.email_verifications OWNER TO scripthub_user;

--
-- Name: TABLE email_verifications; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.email_verifications IS 'Email verification tokens';


--
-- Name: executor_versions; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.executor_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    executor_id uuid NOT NULL,
    version character varying(50) NOT NULL,
    download_url text NOT NULL,
    patch_notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.executor_versions OWNER TO scripthub_user;

--
-- Name: TABLE executor_versions; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.executor_versions IS 'Release history and download links for specific executors';


--
-- Name: executors; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.executors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    website character varying(255),
    discord character varying(255),
    telegram character varying(255),
    platforms text[] DEFAULT '{}'::text[],
    price_model character varying(20) DEFAULT 'Free'::character varying,
    status public.executor_status DEFAULT 'pending'::public.executor_status,
    logo_url text,
    banner_url text,
    tags text[] DEFAULT '{}'::text[],
    owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.executors OWNER TO scripthub_user;

--
-- Name: TABLE executors; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.executors IS 'Executor listings created by developers/vendors';


--
-- Name: games; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.games (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    game_platform_id character varying(100),
    platform character varying(50) DEFAULT 'roblox'::character varying,
    logo_url text,
    banner_url text,
    slug character varying(150) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.games OWNER TO scripthub_user;

--
-- Name: TABLE games; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.games IS 'Game categories for organizing scripts by game';


--
-- Name: hubs; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.hubs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    banner_url text,
    logo_url text,
    owner_id uuid NOT NULL,
    status public.hub_status DEFAULT 'pending'::public.hub_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    discord_server character varying(255),
    is_official boolean DEFAULT false,
    is_verified boolean DEFAULT false
);


ALTER TABLE public.hubs OWNER TO scripthub_user;

--
-- Name: TABLE hubs; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.hubs IS 'Collections of scripts managed by a user (vendor)';


--
-- Name: COLUMN hubs.discord_server; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.hubs.discord_server IS 'Optional Discord server invite link';


--
-- Name: COLUMN hubs.is_official; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.hubs.is_official IS 'Hub is officially managed by ScriptHub team';


--
-- Name: COLUMN hubs.is_verified; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.hubs.is_verified IS 'Hub has been verified for authenticity';


--
-- Name: key_devices; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.key_devices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key_id uuid NOT NULL,
    hwid character varying(128) NOT NULL,
    ip_address character varying(45),
    first_seen_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.key_devices OWNER TO scripthub_user;

--
-- Name: TABLE key_devices; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.key_devices IS 'Devices bound to license keys via HWID';


--
-- Name: key_settings; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.key_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    device_lock_enabled boolean DEFAULT true NOT NULL,
    max_devices_per_key integer DEFAULT 1 NOT NULL,
    rate_limiting_enabled boolean DEFAULT true NOT NULL,
    auto_expire_enabled boolean DEFAULT false NOT NULL,
    hwid_blacklist_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    getkey_enabled boolean DEFAULT false NOT NULL,
    checkpoint_count integer DEFAULT 2 NOT NULL,
    ad_links text[] DEFAULT '{}'::text[],
    checkpoint_timer_seconds integer DEFAULT 10 NOT NULL,
    captcha_enabled boolean DEFAULT true NOT NULL,
    key_duration_hours integer DEFAULT 6 NOT NULL,
    max_keys_per_ip integer DEFAULT 1 NOT NULL,
    cooldown_hours integer DEFAULT 24 NOT NULL,
    workink_enabled boolean DEFAULT false NOT NULL,
    linkvertise_enabled boolean DEFAULT false NOT NULL,
    official_enabled boolean DEFAULT true NOT NULL,
    workink_url text DEFAULT ''::text,
    linkvertise_url text DEFAULT ''::text
);


ALTER TABLE public.key_settings OWNER TO scripthub_user;

--
-- Name: TABLE key_settings; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.key_settings IS 'Per-user security configuration for the key system';


--
-- Name: COLUMN key_settings.getkey_enabled; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.key_settings.getkey_enabled IS 'Master toggle for Get Key ad system';


--
-- Name: COLUMN key_settings.checkpoint_count; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.key_settings.checkpoint_count IS 'Number of ad checkpoint buttons users must click';


--
-- Name: COLUMN key_settings.ad_links; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.key_settings.ad_links IS 'Array of Adsterra Direct Link URLs';


--
-- Name: COLUMN key_settings.checkpoint_timer_seconds; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.key_settings.checkpoint_timer_seconds IS 'Countdown seconds per checkpoint button';


--
-- Name: COLUMN key_settings.captcha_enabled; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.key_settings.captcha_enabled IS 'Show math captcha for human verification';


--
-- Name: COLUMN key_settings.key_duration_hours; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.key_settings.key_duration_hours IS 'Auto-expire duration for generated keys in hours';


--
-- Name: COLUMN key_settings.max_keys_per_ip; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.key_settings.max_keys_per_ip IS 'Max keys per IP per script per cooldown period';


--
-- Name: COLUMN key_settings.cooldown_hours; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.key_settings.cooldown_hours IS 'Hours before same IP can request new key';


--
-- Name: license_keys; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.license_keys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key_value character varying(32) NOT NULL,
    script_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    type public.key_type DEFAULT 'lifetime'::public.key_type NOT NULL,
    status public.key_status DEFAULT 'unused'::public.key_status NOT NULL,
    max_devices integer DEFAULT 1 NOT NULL,
    expires_at timestamp with time zone,
    note text,
    last_activity_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.license_keys OWNER TO scripthub_user;

--
-- Name: TABLE license_keys; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.license_keys IS 'License keys generated by script owners for access control';


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    applied_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.migrations OWNER TO scripthub_user;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: scripthub_user
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO scripthub_user;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripthub_user
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: monetization_sessions; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.monetization_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    script_slug character varying(128) NOT NULL,
    provider public.monetization_provider NOT NULL,
    ip_hash character varying(64) NOT NULL,
    ua_hash character varying(64) NOT NULL,
    signature character varying(128) NOT NULL,
    used boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    checkpoint_index integer DEFAULT 0 NOT NULL,
    total_checkpoints integer DEFAULT 1 NOT NULL,
    checkpoints_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    last_checkpoint_at timestamp with time zone,
    captcha_verified boolean DEFAULT false NOT NULL,
    captcha_token_hash character varying(64)
);


ALTER TABLE public.monetization_sessions OWNER TO scripthub_user;

--
-- Name: TABLE monetization_sessions; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.monetization_sessions IS 'HMAC-signed monetization sessions for key generation flow';


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.password_resets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.password_resets OWNER TO scripthub_user;

--
-- Name: TABLE password_resets; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.password_resets IS 'Password reset tokens';


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.permissions OWNER TO scripthub_user;

--
-- Name: TABLE permissions; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.permissions IS 'Granular permissions for resources';


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.role_permissions OWNER TO scripthub_user;

--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.role_permissions IS 'Many-to-many relationship between roles and permissions';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO scripthub_user;

--
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.roles IS 'System roles for RBAC';


--
-- Name: script_comments; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.script_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    script_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    parent_id uuid,
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.script_comments OWNER TO scripthub_user;

--
-- Name: script_likes; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.script_likes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    script_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.script_likes OWNER TO scripthub_user;

--
-- Name: script_tags; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.script_tags (
    script_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


ALTER TABLE public.script_tags OWNER TO scripthub_user;

--
-- Name: TABLE script_tags; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.script_tags IS 'Many-to-many relationship between scripts and tags';


--
-- Name: script_views; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.script_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    script_id uuid NOT NULL,
    ip_address inet NOT NULL,
    user_agent text,
    viewed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.script_views OWNER TO scripthub_user;

--
-- Name: scripts; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.scripts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(150) NOT NULL,
    slug character varying(150) NOT NULL,
    description text,
    thumbnail_url text,
    loader_url text,
    hub_id uuid,
    owner_id uuid NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    game_id uuid,
    deleted_at timestamp with time zone,
    has_key_system boolean DEFAULT false,
    key_system_url text,
    is_paid boolean DEFAULT false,
    purchase_url text,
    copies integer DEFAULT 0,
    youtube_url text,
    CONSTRAINT scripts_status_check CHECK (((status)::text = ANY ((ARRAY['published'::character varying, 'draft'::character varying, 'under_review'::character varying])::text[])))
);


ALTER TABLE public.scripts OWNER TO scripthub_user;

--
-- Name: TABLE scripts; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.scripts IS 'User-uploaded scripts with metadata, views, and likes';


--
-- Name: COLUMN scripts.copies; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON COLUMN public.scripts.copies IS 'Number of times the loader script has been copied';


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token text NOT NULL,
    user_agent text,
    ip_address inet,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_used_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sessions OWNER TO scripthub_user;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.sessions IS 'User sessions and refresh tokens';


--
-- Name: tags; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tags OWNER TO scripthub_user;

--
-- Name: TABLE tags; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.tags IS 'Reusable tags for categorizing scripts';


--
-- Name: used_captcha_tokens; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.used_captcha_tokens (
    token_hash character varying(64) NOT NULL,
    session_id uuid NOT NULL,
    used_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.used_captcha_tokens OWNER TO scripthub_user;

--
-- Name: TABLE used_captcha_tokens; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.used_captcha_tokens IS 'Anti-replay store for Turnstile captcha tokens';


--
-- Name: user_maximums; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.user_maximums (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    maximum_obfuscation integer DEFAULT 0 NOT NULL,
    maximum_keys integer DEFAULT 0 NOT NULL,
    maximum_deployments integer DEFAULT 3 NOT NULL,
    maximums_reset_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    maximum_devices_per_key integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.user_maximums OWNER TO scripthub_user;

--
-- Name: user_plans; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.user_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    plan_type public.plan_type DEFAULT 'free'::public.plan_type NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_plans OWNER TO scripthub_user;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid
);


ALTER TABLE public.user_roles OWNER TO scripthub_user;

--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.user_roles IS 'Many-to-many relationship between users and roles';


--
-- Name: users; Type: TABLE; Schema: public; Owner: scripthub_user
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255),
    email_verified boolean DEFAULT false,
    password_hash character varying(255),
    display_name character varying(100),
    avatar_url text,
    bio text,
    account_status character varying(20) DEFAULT 'active'::character varying,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    api_key character varying(64),
    CONSTRAINT users_account_status_check CHECK (((account_status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'deleted'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO scripthub_user;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: scripthub_user
--

COMMENT ON TABLE public.users IS 'Main users table storing user accounts';


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_providers auth_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.auth_providers
    ADD CONSTRAINT auth_providers_pkey PRIMARY KEY (id);


--
-- Name: auth_providers auth_providers_provider_provider_user_id_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.auth_providers
    ADD CONSTRAINT auth_providers_provider_provider_user_id_key UNIQUE (provider, provider_user_id);


--
-- Name: deployments deployments_deploy_key_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_deploy_key_key UNIQUE (deploy_key);


--
-- Name: deployments deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_token_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_token_key UNIQUE (token);


--
-- Name: executor_versions executor_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.executor_versions
    ADD CONSTRAINT executor_versions_pkey PRIMARY KEY (id);


--
-- Name: executors executors_name_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.executors
    ADD CONSTRAINT executors_name_key UNIQUE (name);


--
-- Name: executors executors_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.executors
    ADD CONSTRAINT executors_pkey PRIMARY KEY (id);


--
-- Name: executors executors_slug_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.executors
    ADD CONSTRAINT executors_slug_key UNIQUE (slug);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: games games_slug_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_slug_key UNIQUE (slug);


--
-- Name: hubs hubs_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.hubs
    ADD CONSTRAINT hubs_pkey PRIMARY KEY (id);


--
-- Name: hubs hubs_slug_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.hubs
    ADD CONSTRAINT hubs_slug_key UNIQUE (slug);


--
-- Name: key_devices key_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.key_devices
    ADD CONSTRAINT key_devices_pkey PRIMARY KEY (id);


--
-- Name: key_settings key_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.key_settings
    ADD CONSTRAINT key_settings_pkey PRIMARY KEY (id);


--
-- Name: key_settings key_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.key_settings
    ADD CONSTRAINT key_settings_user_id_key UNIQUE (user_id);


--
-- Name: license_keys license_keys_key_value_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_key_value_key UNIQUE (key_value);


--
-- Name: license_keys license_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: monetization_sessions monetization_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.monetization_sessions
    ADD CONSTRAINT monetization_sessions_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_token_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_token_key UNIQUE (token);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: script_comments script_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_comments
    ADD CONSTRAINT script_comments_pkey PRIMARY KEY (id);


--
-- Name: script_likes script_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_likes
    ADD CONSTRAINT script_likes_pkey PRIMARY KEY (id);


--
-- Name: script_likes script_likes_script_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_likes
    ADD CONSTRAINT script_likes_script_id_user_id_key UNIQUE (script_id, user_id);


--
-- Name: script_tags script_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_tags
    ADD CONSTRAINT script_tags_pkey PRIMARY KEY (script_id, tag_id);


--
-- Name: script_views script_views_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_views
    ADD CONSTRAINT script_views_pkey PRIMARY KEY (id);


--
-- Name: script_views script_views_script_id_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_views
    ADD CONSTRAINT script_views_script_id_ip_address_key UNIQUE (script_id, ip_address);


--
-- Name: scripts scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_pkey PRIMARY KEY (id);


--
-- Name: scripts scripts_slug_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_slug_key UNIQUE (slug);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_key UNIQUE (slug);


--
-- Name: used_captcha_tokens used_captcha_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.used_captcha_tokens
    ADD CONSTRAINT used_captcha_tokens_pkey PRIMARY KEY (token_hash);


--
-- Name: user_maximums user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_maximums
    ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);


--
-- Name: user_maximums user_credits_user_id_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_maximums
    ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);


--
-- Name: user_plans user_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_plans
    ADD CONSTRAINT user_plans_pkey PRIMARY KEY (id);


--
-- Name: user_plans user_plans_user_id_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_plans
    ADD CONSTRAINT user_plans_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_api_key_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_api_key_key UNIQUE (api_key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_resource_type; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_auth_providers_provider; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_auth_providers_provider ON public.auth_providers USING btree (provider);


--
-- Name: idx_auth_providers_provider_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_auth_providers_provider_user_id ON public.auth_providers USING btree (provider, provider_user_id);


--
-- Name: idx_auth_providers_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_auth_providers_user_id ON public.auth_providers USING btree (user_id);


--
-- Name: idx_deployments_deploy_key; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_deployments_deploy_key ON public.deployments USING btree (deploy_key);


--
-- Name: idx_deployments_status; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_deployments_status ON public.deployments USING btree (status);


--
-- Name: idx_deployments_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_deployments_user_id ON public.deployments USING btree (user_id);


--
-- Name: idx_email_verifications_expires_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_email_verifications_expires_at ON public.email_verifications USING btree (expires_at);


--
-- Name: idx_email_verifications_token; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_email_verifications_token ON public.email_verifications USING btree (token);


--
-- Name: idx_email_verifications_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_email_verifications_user_id ON public.email_verifications USING btree (user_id);


--
-- Name: idx_executor_versions_created_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_executor_versions_created_at ON public.executor_versions USING btree (created_at DESC);


--
-- Name: idx_executor_versions_executor_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_executor_versions_executor_id ON public.executor_versions USING btree (executor_id);


--
-- Name: idx_executors_deleted_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_executors_deleted_at ON public.executors USING btree (deleted_at);


--
-- Name: idx_executors_owner_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_executors_owner_id ON public.executors USING btree (owner_id);


--
-- Name: idx_executors_slug; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_executors_slug ON public.executors USING btree (slug);


--
-- Name: idx_executors_status; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_executors_status ON public.executors USING btree (status);


--
-- Name: idx_games_name; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_games_name ON public.games USING btree (name);


--
-- Name: idx_games_platform_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_games_platform_id ON public.games USING btree (game_platform_id);


--
-- Name: idx_games_slug; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_games_slug ON public.games USING btree (slug);


--
-- Name: idx_hubs_created_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_hubs_created_at ON public.hubs USING btree (created_at DESC);


--
-- Name: idx_hubs_is_official; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_hubs_is_official ON public.hubs USING btree (is_official) WHERE (is_official = true);


--
-- Name: idx_hubs_is_verified; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_hubs_is_verified ON public.hubs USING btree (is_verified) WHERE (is_verified = true);


--
-- Name: idx_hubs_owner_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_hubs_owner_id ON public.hubs USING btree (owner_id);


--
-- Name: idx_hubs_slug; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_hubs_slug ON public.hubs USING btree (slug);


--
-- Name: idx_hubs_status; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_hubs_status ON public.hubs USING btree (status);


--
-- Name: idx_key_devices_hwid; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_key_devices_hwid ON public.key_devices USING btree (hwid);


--
-- Name: idx_key_devices_key_hwid; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE UNIQUE INDEX idx_key_devices_key_hwid ON public.key_devices USING btree (key_id, hwid);


--
-- Name: idx_key_devices_key_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_key_devices_key_id ON public.key_devices USING btree (key_id);


--
-- Name: idx_license_keys_created_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_license_keys_created_at ON public.license_keys USING btree (created_at DESC);


--
-- Name: idx_license_keys_key_value; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_license_keys_key_value ON public.license_keys USING btree (key_value);


--
-- Name: idx_license_keys_owner_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_license_keys_owner_id ON public.license_keys USING btree (owner_id);


--
-- Name: idx_license_keys_script_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_license_keys_script_id ON public.license_keys USING btree (script_id);


--
-- Name: idx_license_keys_status; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_license_keys_status ON public.license_keys USING btree (status);


--
-- Name: idx_monetization_sessions_created; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_monetization_sessions_created ON public.monetization_sessions USING btree (created_at) WHERE (used = false);


--
-- Name: idx_monetization_sessions_ip_used; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_monetization_sessions_ip_used ON public.monetization_sessions USING btree (ip_hash, used) WHERE (used = false);


--
-- Name: idx_monetization_sessions_signature; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE UNIQUE INDEX idx_monetization_sessions_signature ON public.monetization_sessions USING btree (signature);


--
-- Name: idx_monetization_sessions_slug_created; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_monetization_sessions_slug_created ON public.monetization_sessions USING btree (script_slug, created_at DESC);


--
-- Name: idx_password_resets_expires_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_password_resets_expires_at ON public.password_resets USING btree (expires_at);


--
-- Name: idx_password_resets_token; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_password_resets_token ON public.password_resets USING btree (token);


--
-- Name: idx_password_resets_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_password_resets_user_id ON public.password_resets USING btree (user_id);


--
-- Name: idx_permissions_action; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_permissions_action ON public.permissions USING btree (action);


--
-- Name: idx_permissions_resource; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_permissions_resource ON public.permissions USING btree (resource);


--
-- Name: idx_permissions_resource_action; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_permissions_resource_action ON public.permissions USING btree (resource, action);


--
-- Name: idx_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: idx_script_comments_created_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_comments_created_at ON public.script_comments USING btree (created_at);


--
-- Name: idx_script_comments_parent_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_comments_parent_id ON public.script_comments USING btree (parent_id);


--
-- Name: idx_script_comments_script_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_comments_script_id ON public.script_comments USING btree (script_id);


--
-- Name: idx_script_comments_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_comments_user_id ON public.script_comments USING btree (user_id);


--
-- Name: idx_script_likes_script_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_likes_script_id ON public.script_likes USING btree (script_id);


--
-- Name: idx_script_likes_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_likes_user_id ON public.script_likes USING btree (user_id);


--
-- Name: idx_script_tags_script; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_tags_script ON public.script_tags USING btree (script_id);


--
-- Name: idx_script_tags_tag; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_tags_tag ON public.script_tags USING btree (tag_id);


--
-- Name: idx_script_views_ip_address; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_views_ip_address ON public.script_views USING btree (ip_address);


--
-- Name: idx_script_views_script_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_views_script_id ON public.script_views USING btree (script_id);


--
-- Name: idx_script_views_viewed_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_script_views_viewed_at ON public.script_views USING btree (viewed_at);


--
-- Name: idx_scripts_created_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_scripts_created_at ON public.scripts USING btree (created_at DESC);


--
-- Name: idx_scripts_deleted_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_scripts_deleted_at ON public.scripts USING btree (deleted_at);


--
-- Name: idx_scripts_game_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_scripts_game_id ON public.scripts USING btree (game_id);


--
-- Name: idx_scripts_hub_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_scripts_hub_id ON public.scripts USING btree (hub_id);


--
-- Name: idx_scripts_is_paid; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_scripts_is_paid ON public.scripts USING btree (is_paid);


--
-- Name: idx_scripts_owner_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_scripts_owner_id ON public.scripts USING btree (owner_id);


--
-- Name: idx_scripts_slug; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_scripts_slug ON public.scripts USING btree (slug);


--
-- Name: idx_scripts_status; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_scripts_status ON public.scripts USING btree (status);


--
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_refresh_token; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_sessions_refresh_token ON public.sessions USING btree (refresh_token);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_tags_name; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_tags_name ON public.tags USING btree (name);


--
-- Name: idx_tags_slug; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_tags_slug ON public.tags USING btree (slug);


--
-- Name: idx_used_captcha_tokens_session; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_used_captcha_tokens_session ON public.used_captcha_tokens USING btree (session_id);


--
-- Name: idx_user_maximums_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_user_maximums_user_id ON public.user_maximums USING btree (user_id);


--
-- Name: idx_user_plans_plan_type; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_user_plans_plan_type ON public.user_plans USING btree (plan_type);


--
-- Name: idx_user_plans_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_user_plans_user_id ON public.user_plans USING btree (user_id);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_users_account_status; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_users_account_status ON public.users USING btree (account_status);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: scripthub_user
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: auth_providers update_auth_providers_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_auth_providers_updated_at BEFORE UPDATE ON public.auth_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deployments update_deployments_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON public.deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: executors update_executors_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_executors_updated_at BEFORE UPDATE ON public.executors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: games update_games_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hubs update_hubs_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_hubs_updated_at BEFORE UPDATE ON public.hubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: key_settings update_key_settings_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_key_settings_updated_at BEFORE UPDATE ON public.key_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: license_keys update_license_keys_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_license_keys_updated_at BEFORE UPDATE ON public.license_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: permissions update_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: script_comments update_script_comments_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_script_comments_updated_at BEFORE UPDATE ON public.script_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scripts update_scripts_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON public.scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_maximums update_user_maximums_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_user_maximums_updated_at BEFORE UPDATE ON public.user_maximums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_plans update_user_plans_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON public.user_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: scripthub_user
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: auth_providers auth_providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.auth_providers
    ADD CONSTRAINT auth_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: deployments deployments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: email_verifications email_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: executor_versions executor_versions_executor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.executor_versions
    ADD CONSTRAINT executor_versions_executor_id_fkey FOREIGN KEY (executor_id) REFERENCES public.executors(id) ON DELETE CASCADE;


--
-- Name: executors executors_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.executors
    ADD CONSTRAINT executors_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hubs hubs_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.hubs
    ADD CONSTRAINT hubs_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: key_devices key_devices_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.key_devices
    ADD CONSTRAINT key_devices_key_id_fkey FOREIGN KEY (key_id) REFERENCES public.license_keys(id) ON DELETE CASCADE;


--
-- Name: key_settings key_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.key_settings
    ADD CONSTRAINT key_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: license_keys license_keys_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: license_keys license_keys_script_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_script_id_fkey FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE CASCADE;


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: script_comments script_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_comments
    ADD CONSTRAINT script_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.script_comments(id) ON DELETE CASCADE;


--
-- Name: script_comments script_comments_script_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_comments
    ADD CONSTRAINT script_comments_script_id_fkey FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE CASCADE;


--
-- Name: script_comments script_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_comments
    ADD CONSTRAINT script_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: script_likes script_likes_script_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_likes
    ADD CONSTRAINT script_likes_script_id_fkey FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE CASCADE;


--
-- Name: script_likes script_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_likes
    ADD CONSTRAINT script_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: script_tags script_tags_script_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_tags
    ADD CONSTRAINT script_tags_script_id_fkey FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE CASCADE;


--
-- Name: script_tags script_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_tags
    ADD CONSTRAINT script_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: script_views script_views_script_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.script_views
    ADD CONSTRAINT script_views_script_id_fkey FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE CASCADE;


--
-- Name: scripts scripts_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE SET NULL;


--
-- Name: scripts scripts_hub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_hub_id_fkey FOREIGN KEY (hub_id) REFERENCES public.hubs(id) ON DELETE SET NULL;


--
-- Name: scripts scripts_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: used_captcha_tokens used_captcha_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.used_captcha_tokens
    ADD CONSTRAINT used_captcha_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.monetization_sessions(id) ON DELETE CASCADE;


--
-- Name: user_maximums user_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_maximums
    ADD CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_plans user_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_plans
    ADD CONSTRAINT user_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scripthub_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict mE1PWO1UjyFkcOCn92KTcfaIQ0WChvC9lzTaKPTIfTc3kiU3fD9rpDB4A2XV6Mg

