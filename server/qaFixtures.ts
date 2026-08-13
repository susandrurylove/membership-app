import type { getPublishedCourse, getPublishedTeaching } from "./memberData";

type PublishedTeaching = NonNullable<Awaited<ReturnType<typeof getPublishedTeaching>>>;
type PublishedCourse = NonNullable<Awaited<ReturnType<typeof getPublishedCourse>>>;

export const QA_TEACHING_SLUG = "responsive-qa-teaching";
export const QA_COURSE_SLUG = "responsive-qa-course";
export const QA_MEDIA_ID = 900_001;

const createdAt = new Date("2026-01-01T00:00:00.000Z");

const imageAsset = {
  id: QA_MEDIA_ID,
  kind: "image",
  storageKey: "development-only/responsive-qa-mandala.svg",
  originalName: "Susan Drury mandala.svg",
  mimeType: "image/svg+xml",
  byteSize: 0,
  altText: "Susan Drury mandala symbol in warm gold",
  uploadedByUserId: 1,
  createdAt,
};

export function isDevelopmentQaRequest() {
  return process.env.NODE_ENV === "development";
}

export function getDevelopmentTeachingFixture(): PublishedTeaching {
  return {
    teaching: {
      id: 900_001,
      categoryId: 900_001,
      title: "Returning to the Wisdom of the Heart",
      slug: QA_TEACHING_SLUG,
      summary: "A quiet reflection on listening beneath the noise and returning to the steady intelligence already present within you.",
      body: "## A moment of return\n\nPlace one hand over your heart and allow your breath to soften. Nothing needs to be solved in this moment. Notice what becomes available when you listen without asking for an immediate answer.\n\n### A gentle practice\n\n- Breathe slowly for three rounds.\n- Notice the quality of your inner space.\n- Ask: *What is love inviting me to remember?*\n\nCarry one clear word from this practice into the rest of your day.",
      contentType: "mixed",
      status: "published",
      featured: true,
      sortOrder: 0,
      publishedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    },
    category: {
      id: 900_001,
      name: "Living Wisdom",
      slug: "living-wisdom",
      description: "Practices for returning to clarity, compassion, and inner trust.",
      sortOrder: 0,
      createdAt,
      updatedAt: createdAt,
    },
    assets: [{ asset: imageAsset, usage: "primary", sortOrder: 0 }],
  } as unknown as PublishedTeaching;
}

export function getDevelopmentCourseFixture(): PublishedCourse {
  return {
    course: {
      id: 900_001,
      title: "Elevate Into Love",
      slug: QA_COURSE_SLUG,
      summary: "A grounded, self-paced journey through awareness, embodiment, and compassionate action.",
      description: "Move through each lesson gently. Your progress is held for your return.",
      status: "published",
      coverAssetId: null,
      estimatedMinutes: 48,
      sortOrder: 0,
      publishedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    },
    sections: [
      {
        id: 900_001,
        courseId: 900_001,
        title: "Opening the Heart",
        description: "Begin with presence and inner listening.",
        sortOrder: 0,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 900_002,
        courseId: 900_001,
        title: "Living the Practice",
        description: "Carry insight into relationship and daily life.",
        sortOrder: 1,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    lessons: [
      {
        lesson: {
          id: 900_001,
          courseId: 900_001,
          sectionId: 900_001,
          title: "Listening Beneath the Noise",
          slug: "listening-beneath-the-noise",
          summary: "Create enough quiet to hear the wisdom that has been waiting beneath urgency.",
          body: "## Arriving here\n\nLet your shoulders soften and allow the ground to hold your weight. This lesson is an invitation to listen without forcing an answer.\n\nNotice one place in your life where gentleness can replace urgency today.",
          contentType: "mixed",
          mediaAssetId: QA_MEDIA_ID,
          status: "published",
          estimatedMinutes: 14,
          sortOrder: 0,
          createdAt,
          updatedAt: createdAt,
        },
        media: imageAsset,
        progress: null,
      },
      {
        lesson: {
          id: 900_002,
          courseId: 900_001,
          sectionId: 900_001,
          title: "The Breath as a Bridge",
          slug: "the-breath-as-a-bridge",
          summary: "Use the breath to reconnect thought, feeling, and embodied presence.",
          body: "## Three conscious breaths\n\nBreathe in with awareness, pause without strain, and release more slowly than you arrived.",
          contentType: "text",
          mediaAssetId: null,
          status: "published",
          estimatedMinutes: 10,
          sortOrder: 1,
          createdAt,
          updatedAt: createdAt,
        },
        media: null,
        progress: {
          id: 900_001,
          userId: 1,
          courseId: 900_001,
          lessonId: 900_002,
          status: "completed",
          percentComplete: 100,
          lastPositionSeconds: 0,
          startedAt: createdAt,
          completedAt: createdAt,
          createdAt,
          updatedAt: createdAt,
        },
      },
      {
        lesson: {
          id: 900_003,
          courseId: 900_001,
          sectionId: 900_002,
          title: "Choosing Love in Motion",
          slug: "choosing-love-in-motion",
          summary: "Translate awareness into one compassionate choice in ordinary life.",
          body: "## One embodied choice\n\nChoose one small action that expresses the truth you have remembered.",
          contentType: "text",
          mediaAssetId: null,
          status: "published",
          estimatedMinutes: 12,
          sortOrder: 2,
          createdAt,
          updatedAt: createdAt,
        },
        media: null,
        progress: null,
      },
    ],
    progress: { total: 3, completed: 1, percent: 33 },
  } as unknown as PublishedCourse;
}

export function getDevelopmentMediaFixture(mediaId: number) {
  if (mediaId !== QA_MEDIA_ID || !isDevelopmentQaRequest()) return null;
  return {
    key: imageAsset.storageKey,
    url: "https://susan-website-pull.b-cdn.net/2024/logo/sd-mandala-mark.svg",
    mimeType: imageAsset.mimeType,
    kind: imageAsset.kind,
  };
}
