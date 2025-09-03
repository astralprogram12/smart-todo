CREATE TABLE public.oauth_state (
  state text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT oauth_state_pkey PRIMARY KEY (state),
  CONSTRAINT oauth_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;
