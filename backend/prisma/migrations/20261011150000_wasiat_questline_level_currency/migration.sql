ALTER TABLE "users"
  ADD COLUMN "xpTotal" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "currency" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "wasiat"
  ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false;

-- Existing users have no legacy XP balance; initialize level and currency from xpTotal.
UPDATE "users" SET "level" = 1, "currency" = 0 WHERE "xpTotal" = 0;

-- Normalize historical answer data to exactly three choices and a valid 0..2 key.
WITH normalized AS (
  SELECT
    step."id",
    jsonb_agg(
      CASE
        WHEN jsonb_typeof(question.value -> 'opsi') = 'array' THEN
          jsonb_set(
            jsonb_set(
              question.value,
              '{opsi}',
              (
                SELECT jsonb_agg(choice.value ORDER BY choice.ordinality)
                FROM jsonb_array_elements(
                  (question.value -> 'opsi') || jsonb_build_array('Pilihan tambahan', 'Pilihan tambahan', 'Pilihan tambahan')
                ) WITH ORDINALITY AS choice(value, ordinality)
                WHERE choice.ordinality <= 3
              ),
              true
            ),
            '{jawabanBenar}',
            CASE
              WHEN (question.value ->> 'jawabanBenar') ~ '^[0-2]$' THEN to_jsonb((question.value ->> 'jawabanBenar')::INTEGER)
              ELSE '0'::jsonb
            END,
            true
          )
        ELSE question.value
      END
      ORDER BY question.ordinality
    ) AS "kuis"
  FROM "wasiat_langkah" AS step
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(step."kuis") = 'array' THEN step."kuis" ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS question(value, ordinality)
  GROUP BY step."id"
)
UPDATE "wasiat_langkah" AS step
SET "kuis" = normalized."kuis"
FROM normalized
WHERE step."id" = normalized."id";
