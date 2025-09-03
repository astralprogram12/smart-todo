-- Create the new types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_action_type') THEN
        CREATE TYPE public.schedule_action_type AS ENUM ('send_notification');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
        CREATE TYPE public.schedule_type AS ENUM ('one_time', 'recurring');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_status') THEN
        CREATE TYPE public.schedule_status AS ENUM ('active', 'completed', 'failed');
    END IF;
END
$$;

-- Create the scheduled_actions table
CREATE TABLE public.scheduled_actions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  user_id uuid NOT NULL,
  action_type public.schedule_action_type NOT NULL,
  action_payload jsonb NOT NULL,
  schedule_type public.schedule_type NOT NULL,
  schedule_value text NOT NULL,
  status public.schedule_status NOT NULL DEFAULT 'active'::schedule_status,
  timezone text NOT NULL,
  last_run_at timestamp WITH time zone NULL,
  next_run_at timestamp WITH time zone NOT NULL,
  created_at timestamp WITH time zone NOT NULL DEFAULT now(),
  updated_at timestamp WITH time zone NOT NULL DEFAULT now(),
  summary text NULL,
  CONSTRAINT scheduled_actions_pkey PRIMARY KEY (id),
  CONSTRAINT scheduled_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_status_next_run_at ON public.scheduled_actions USING btree (status, next_run_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_user_id ON public.scheduled_actions USING btree (user_id) TABLESPACE pg_default;
