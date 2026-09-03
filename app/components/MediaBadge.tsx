import { Camera, Video } from "lucide-react";
import { Badge } from "./ui";
import type { Project } from "../data/projects";

/** The small "video" / "photo" tag beside a project title. */
export default function MediaBadge({ media, suffix = "" }: { media?: Project["media"]; suffix?: string }) {
  if (!media || media === "none") return null;
  const icon = media === "video" ? <Video size={11} /> : <Camera size={11} />;
  return (
    <Badge icon={icon}>
      {media}
      {suffix}
    </Badge>
  );
}
