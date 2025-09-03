CREATE TABLE public.google_calendar_tokens (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT google_calendar_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT google_calendar_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT google_calendar_tokens_user_id_key UNIQUE (user_id)
) TABLESPACE pg_default;
