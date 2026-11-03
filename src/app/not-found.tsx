import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 text-center">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground">Ce match ou cette page n&apos;existe pas.</p>
      <Link href="/" className="text-primary underline">
        Retour aux matchs
      </Link>
    </div>
  );
}
