CREATE TABLE public.virtual_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  pdf_path text NOT NULL,
  pdf_filename text NOT NULL DEFAULT 'exam.pdf',
  question_count integer NOT NULL DEFAULT 5,
  duration_minutes integer NOT NULL DEFAULT 30,
  max_attempts integer NOT NULL DEFAULT 1,
  due_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ve_q CHECK (question_count BETWEEN 1 AND 50),
  CONSTRAINT ve_d CHECK (duration_minutes BETWEEN 1 AND 300),
  CONSTRAINT ve_a CHECK (max_attempts BETWEEN 1 AND 10)
);
GRANT ALL ON public.virtual_exams TO service_role;
ALTER TABLE public.virtual_exams ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.virtual_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.virtual_exams(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  attempt_number integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  deadline_at timestamptz NOT NULL,
  submitted_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress',
  auto_submitted boolean NOT NULL DEFAULT false,
  question_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes_saved_at timestamptz,
  report jsonb,
  report_status text NOT NULL DEFAULT 'none',
  report_error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vea_status CHECK (status IN ('in_progress','submitted'))
);
CREATE UNIQUE INDEX virtual_exam_attempts_unique ON public.virtual_exam_attempts (exam_id, lower(student_name), attempt_number);
GRANT ALL ON public.virtual_exam_attempts TO service_role;
ALTER TABLE public.virtual_exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.virtual_exam_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.virtual_exam_attempts(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  audio_path text NOT NULL,
  mime text NOT NULL,
  duration_ms integer NOT NULL DEFAULT 0,
  transcript text NOT NULL DEFAULT '',
  transcript_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX virtual_exam_recordings_attempt ON public.virtual_exam_recordings (attempt_id);
GRANT ALL ON public.virtual_exam_recordings TO service_role;
ALTER TABLE public.virtual_exam_recordings ENABLE ROW LEVEL SECURITY;