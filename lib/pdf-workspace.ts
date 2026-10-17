import { z } from "zod";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const pointSchema = z.strictObject({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1),
});

export const penAnnotationSchema = z.strictObject({
  id: z.string().min(1).max(128),
  page: z.number().int().positive().max(10000),
  kind: z.literal("pen"),
  color: z.string().regex(hexColorRegex, "Must be #RRGGBB"),
  width: z.number().finite().min(0.0005).max(0.1),
  points: z.array(pointSchema).min(1).max(10000),
});

export const highlightAnnotationSchema = z.strictObject({
  id: z.string().min(1).max(128),
  page: z.number().int().positive().max(10000),
  kind: z.literal("highlight"),
  color: z.string().regex(hexColorRegex, "Must be #RRGGBB"),
  width: z.number().finite().min(0.0005).max(0.1),
  points: z.array(pointSchema).min(1).max(10000),
});

export const noteAnnotationSchema = z.strictObject({
  id: z.string().min(1).max(128),
  page: z.number().int().positive().max(10000),
  kind: z.literal("note"),
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1),
  color: z.string().regex(hexColorRegex, "Must be #RRGGBB"),
  text: z
    .string()
    .min(1)
    .max(10000)
    .refine((s) => s.trim().length > 0, {
      message: "Note text must not be empty or whitespace",
    }),
});



export const annotationSchema = z.discriminatedUnion("kind", [
  penAnnotationSchema,
  highlightAnnotationSchema,
  noteAnnotationSchema,
]);

export type PenAnnotation = z.infer<typeof penAnnotationSchema>;
export type HighlightAnnotation = z.infer<typeof highlightAnnotationSchema>;
export type NoteAnnotation = z.infer<typeof noteAnnotationSchema>;
export type Annotation = z.infer<typeof annotationSchema>;

export const workspaceDocumentSchema = z
  .strictObject({
    page: z.number().int().positive().max(10000),
    zoom: z.number().finite().min(0.5).max(3),
    bookmarks: z
      .array(z.number().int().positive().max(10000))
      .max(1000)
      .refine((bms) => new Set(bms).size === bms.length, {
        message: "Bookmarks must not contain duplicates",
      }),
    annotations: z
      .array(annotationSchema)
      .max(1000)
      .refine(
        (items) => {
          const ids = new Set<string>();
          for (const item of items) {
            if (ids.has(item.id)) return false;
            ids.add(item.id);
          }
          return true;
        },
        { message: "Annotation IDs must be unique" }
      )
      .refine(
        (items) => {
          let totalPoints = 0;
          for (const item of items) {
            if (item.kind === "pen" || item.kind === "highlight") {
              totalPoints += item.points.length;
              if (totalPoints > 100000) return false;
            }
          }
          return true;
        },
        { message: "Total points across all strokes must not exceed 100,000" }
      ),
  });

export type WorkspaceDocument = z.infer<typeof workspaceDocumentSchema>;

export const workspaceSaveSchema = z
  .strictObject({
    baseRevision: z.number().int().nonnegative(),
    mutationId: z.string().min(1).max(128),
    document: workspaceDocumentSchema,
  });

export type WorkspaceSave = z.infer<typeof workspaceSaveSchema>;

export interface WorkspaceSnapshot extends WorkspaceDocument {
  revision: number;
  updatedAt: string | null;
}

export interface WorkspaceApiResponse {
  workspace: WorkspaceSnapshot;
  error?: string;
}
