CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subject text NOT NULL,
  grade_level int NOT NULL DEFAULT 5,
  description text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.confusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  sort_order int NOT NULL,
  nour_says text NOT NULL,
  accepted_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz_question text NOT NULL,
  answer_if_fixed text NOT NULL,
  answer_if_not text NOT NULL,
  short_explanation text NOT NULL,
  hint text NOT NULL DEFAULT '',
  nudge text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic_id, code)
);
CREATE INDEX confusions_topic_order ON public.confusions(topic_id, sort_order);
GRANT ALL ON public.confusions TO service_role;
ALTER TABLE public.confusions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.topics(id),
  grade_level int NOT NULL DEFAULT 5 CHECK (grade_level BETWEEN 1 AND 12),
  mode text NOT NULL DEFAULT 'practice' CHECK (mode IN ('practice','graded')),
  time_limit_minutes int NOT NULL DEFAULT 10 CHECK (time_limit_minutes BETWEEN 1 AND 60),
  due_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignment_confusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  original_confusion_id uuid REFERENCES public.confusions(id) ON DELETE SET NULL,
  code text NOT NULL,
  title text NOT NULL,
  sort_order int NOT NULL,
  nour_says text NOT NULL,
  accepted_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz_question text NOT NULL,
  answer_if_fixed text NOT NULL,
  answer_if_not text NOT NULL,
  short_explanation text NOT NULL,
  hint text NOT NULL DEFAULT '',
  nudge text NOT NULL DEFAULT '',
  UNIQUE (assignment_id, sort_order)
);
GRANT ALL ON public.assignment_confusions TO service_role;
ALTER TABLE public.assignment_confusions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id),
  student_name text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('practice','graded')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  score int,
  adjusted_score int,
  total_questions int NOT NULL DEFAULT 3,
  hints_used int NOT NULL DEFAULT 0,
  session_status text NOT NULL DEFAULT 'active' CHECK (session_status IN ('active','completed')),
  is_sample boolean NOT NULL DEFAULT false,
  duration_seconds int,
  teacher_override_score int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sessions_one_graded ON public.sessions(assignment_id, lower(student_name)) WHERE mode = 'graded';
CREATE INDEX sessions_assignment ON public.sessions(assignment_id);
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  speaker text NOT NULL CHECK (speaker IN ('student','nour','system','teacher')),
  text text NOT NULL,
  confusion_id uuid REFERENCES public.assignment_confusions(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX turns_session_time ON public.turns(session_id, created_at);
GRANT ALL ON public.turns TO service_role;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.session_confusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  assignment_confusion_id uuid NOT NULL REFERENCES public.assignment_confusions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','fixed','taught_wrong')),
  evidence_quote text,
  evidence_turn_id uuid,
  reason_summary text,
  attempt_count int NOT NULL DEFAULT 0,
  hint_count int NOT NULL DEFAULT 0,
  nudge_shown boolean NOT NULL DEFAULT false,
  teacher_override_status text CHECK (teacher_override_status IN ('locked','fixed','taught_wrong')),
  override_note text,
  overridden_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, assignment_confusion_id)
);
GRANT ALL ON public.session_confusions TO service_role;
ALTER TABLE public.session_confusions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.teacher_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  session_confusion_id uuid NOT NULL REFERENCES public.session_confusions(id) ON DELETE CASCADE,
  actor_label text NOT NULL DEFAULT 'Demo teacher',
  before_status text NOT NULL,
  after_status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.teacher_overrides TO service_role;
ALTER TABLE public.teacher_overrides ENABLE ROW LEVEL SECURITY;

-- ===== Seed: topics =====
INSERT INTO public.topics (id, slug, title, subject, grade_level, description) VALUES
('00000000-0000-4000-a000-000000000001','fractions','Comparing and adding fractions','Maths',5,'What the bottom number really means, how to add fractions, and why the pieces must be equal.'),
('00000000-0000-4000-a000-000000000002','photosynthesis','Photosynthesis','Science',7,'Where a plant''s food really comes from, what sunlight does, and whether plants use oxygen.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.confusions (id, topic_id, code, title, sort_order, nour_says, accepted_reasons, quiz_question, answer_if_fixed, answer_if_not, short_explanation, hint, nudge) VALUES
('00000000-0000-4000-b000-000000000001','00000000-0000-4000-a000-000000000001','F1','Bigger bottom number means bigger fraction',1,
 'My teacher says 1/8 is smaller than 1/4. That makes no sense, 8 is bigger than 4!',
 '["For the same-sized whole, cutting it into more equal pieces makes each piece smaller.","A comparison of two equal-size pizzas or bars divided into 4 and 8 equal parts.","Correct numbers or a real-life equivalent example showing eighths are smaller than quarters."]',
 'Which gives you more chocolate from the same-size bar: 1/6 or 1/3?',
 '1/3 gives more chocolate because thirds are larger than sixths when the whole bar is the same size.',
 '1/6, because 6 is bigger than 3.',
 'The denominator tells how many equal parts make the whole. More equal parts means each part is smaller.',
 'Think about what happens to each piece when you share the same thing between more people.',
 'What if we drew two pizzas the same size, and cut one into 4 and one into 8?'),
('00000000-0000-4000-b000-000000000002','00000000-0000-4000-a000-000000000001','F2','Add the tops and the bottoms',2,
 '1/2 + 1/3 = 2/5! You just add the tops and add the bottoms.',
 '["Fraction pieces must be expressed in the same-sized units before adding.","Example: 1/2 = 3/6 and 1/3 = 2/6, so the sum is 5/6.","A correct check that 2/5 cannot be the sum because the sum must be larger than 1/2."]',
 'You eat 1/4 of a pizza, then another 1/4 of the same pizza. How much did you eat altogether?',
 '1/2 of the pizza (2/4).',
 '2/8, because you add the top numbers and the bottom numbers.',
 'To add fractions, use equivalent fractions with a common denominator; do not add denominators directly.',
 'Can you add pieces that are different sizes, or do they need to be the same kind of piece first?',
 'What if we cut both halves and thirds into the same smaller pieces?'),
('00000000-0000-4000-b000-000000000003','00000000-0000-4000-a000-000000000001','F3','Fraction pieces do not have to be equal',3,
 'Cut a cake into 4 pieces, any size, and each one is 1/4.',
 '["A fraction like 1/4 represents one of four equal-sized parts of a whole.","If pieces are unequal, they are not each one quarter.","A comparison drawing or a concrete unequal-slice example."]',
 'A pizza is cut into 3 slices of different sizes. Is the biggest slice exactly 1/3 of the pizza?',
 'No. One third means one of three equal-sized parts; the slices here are different sizes.',
 'Yes. It is one slice out of three, so it must be one third.',
 'Fractions count equal-sized parts of the same whole.',
 'Would it feel fair if your "quarter" of the cake was tiny and someone else''s was huge?',
 'What if we cut a cake into one giant piece and three tiny ones, are they all quarters?'),
('00000000-0000-4000-b000-000000000004','00000000-0000-4000-a000-000000000002','P1','Plants get their food from soil',1,
 'Plants eat dirt, that''s why they need soil.',
 '["Plants make sugars using light energy, water, and carbon dioxide.","Soil supplies minerals and supports roots, but it is not the main food source.","Example: a plant growing in water with nutrients and light."]',
 'Where does most of the dry matter that makes up a tree come from?',
 'Mostly from carbon dioxide in the air, which the plant uses to build sugars and other molecules.',
 'Mostly from dirt that the roots eat.',
 'Plants use carbon dioxide, water, and light energy to make sugars; soil mainly provides support and minerals.',
 'Think about what a plant takes in from the air, not just the ground.',
 'What if a plant grew in a jar of water with no soil at all, where would its food come from?'),
('00000000-0000-4000-b000-000000000005','00000000-0000-4000-a000-000000000002','P2','Sunlight is the plant''s food',2,
 'Plants eat sunlight.',
 '["Sunlight provides the energy for photosynthesis; it is not the material food itself.","Analogy: an oven supplies energy to bake a cake but is not the cake.","The plant also needs water and carbon dioxide as raw materials."]',
 'A plant has sunlight but no water or carbon dioxide. Can it keep making sugar by photosynthesis?',
 'No. Sunlight provides energy, but the plant also needs water and carbon dioxide.',
 'Yes. Sunlight itself is the plant''s food, so nothing else is needed.',
 'Light is energy for the process; water and carbon dioxide are raw materials.',
 'Is energy the same thing as the ingredients something is made from?',
 'What if we think about an oven: does the heat become the cake?'),
('00000000-0000-4000-b000-000000000006','00000000-0000-4000-a000-000000000002','P3','Plants never use oxygen',3,
 'Plants breathe carbon dioxide, so they never need oxygen.',
 '["Plants perform cellular respiration and use oxygen to release energy from sugars.","Respiration happens during both day and night.","A clear day/night or plant-cell example."]',
 'Does a plant use oxygen at night?',
 'Yes. Plants use oxygen for cellular respiration at night as well as during the day.',
 'No. Plants only take in carbon dioxide and never use oxygen.',
 'Photosynthesis uses light; cellular respiration releases energy from sugars and uses oxygen.',
 'How does a plant get energy out of its sugar when there is no light?',
 'What if we think about a plant at midnight, what is it doing in the dark?')
ON CONFLICT (topic_id, code) DO NOTHING;

-- ===== Seed: default assignment + snapshot =====
INSERT INTO public.assignments (id, title, topic_id, grade_level, mode, time_limit_minutes, is_active)
VALUES ('00000000-0000-4000-c000-000000000001','Tonight: Comparing and adding fractions','00000000-0000-4000-a000-000000000001',5,'practice',10,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.assignment_confusions (id, assignment_id, original_confusion_id, code, title, sort_order, nour_says, accepted_reasons, quiz_question, answer_if_fixed, answer_if_not, short_explanation, hint, nudge)
SELECT ('00000000-0000-4000-d000-00000000000' || c.sort_order)::uuid, '00000000-0000-4000-c000-000000000001', c.id, c.code, c.title, c.sort_order, c.nour_says, c.accepted_reasons, c.quiz_question, c.answer_if_fixed, c.answer_if_not, c.short_explanation, c.hint, c.nudge
FROM public.confusions c WHERE c.topic_id = '00000000-0000-4000-a000-000000000001'
ON CONFLICT (id) DO NOTHING;

-- ===== Seed: 24 synthetic sample sessions =====
INSERT INTO public.sessions (id, assignment_id, topic_id, student_name, mode, started_at, ended_at, total_questions, hints_used, session_status, is_sample, duration_seconds)
SELECT md5('intuition-sample-session-' || i)::uuid, '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000001',
  'Sample Student ' || lpad(i::text, 2, '0'), 'practice',
  now() - interval '1 day' - (i || ' minutes')::interval,
  now() - interval '1 day' - (i || ' minutes')::interval + ((300 + i * 13) || ' seconds')::interval,
  3, (i % 3), 'completed', true, 300 + i * 13
FROM generate_series(1, 24) AS i
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.session_confusions (id, session_id, assignment_confusion_id, status, attempt_count, hint_count)
SELECT md5('intuition-sample-sc-' || i || '-' || k)::uuid, md5('intuition-sample-session-' || i)::uuid,
  ('00000000-0000-4000-d000-00000000000' || k)::uuid,
  CASE k
    WHEN 1 THEN CASE WHEN i % 4 = 0 THEN 'locked' WHEN i % 7 = 0 THEN 'taught_wrong' ELSE 'fixed' END
    WHEN 2 THEN CASE WHEN i IN (3, 7, 11, 15, 19, 23) THEN 'fixed' WHEN i % 3 = 0 THEN 'taught_wrong' ELSE 'locked' END
    ELSE CASE WHEN i % 3 = 1 THEN 'locked' WHEN i % 5 = 0 THEN 'taught_wrong' ELSE 'fixed' END
  END,
  1 + ((i + k) % 4),
  CASE WHEN k = 2 AND i % 3 <> 0 THEN 1 ELSE 0 END
FROM generate_series(1, 24) AS i, generate_series(1, 3) AS k
ON CONFLICT (session_id, assignment_confusion_id) DO NOTHING;

UPDATE public.sessions s SET
  score = sub.fixed_count, adjusted_score = sub.fixed_count
FROM (
  SELECT session_id, count(*) FILTER (WHERE status = 'fixed')::int AS fixed_count
  FROM public.session_confusions GROUP BY session_id
) sub
WHERE s.id = sub.session_id AND s.is_sample = true;