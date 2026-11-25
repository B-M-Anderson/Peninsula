import Image from "next/image";
import type { Project } from "../data/projects";

/** A project's icon. When the project has a dark-ground version both are in the markup and CSS shows the one for the ground, so there is no flash on first paint. */
export default function Thumb({ project, size }: { project: Project; size: number }) {
  const light = project.thumbnailUrl ?? "/thumbnails/default.png";
  const dark = project.thumbnailDarkUrl;
  if (!dark) return <Image src={light} alt="" width={size} height={size} className="hub-thumb" />;
  return (
    <>
      <Image src={light} alt="" width={size} height={size} className="hub-thumb thumb-light" />
      <Image src={dark} alt="" width={size} height={size} className="hub-thumb thumb-dark" />
    </>
  );
}
