import { redirect } from "next/navigation";

/**
 * Root /getfreekey page — redirects to main scripthub home.
 * Individual script keys are accessed via /getfreekey/[slug].
 */
export default function GetFreeKeyRootPage() {
    redirect("https://scripthub.id");
}
