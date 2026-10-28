import { existsSync } from "node:fs";
import path from "node:path";
import { Experience } from "@/components/Experience";
export default function Page() {
  return <><Experience catAvailable={existsSync(path.join(process.cwd(), "public/cat.png"))} /><noscript><p className="no-script">psst... you. this little note needs JavaScript to open. ♡</p></noscript></>;
}
