export const metadata = { title: "Suppression des données · Sunday Koura" };

export default function DataDeletionPage() {
  return (
    <article className="space-y-3 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Suppression des données</h1>
      <p>Pour supprimer ton compte et toutes tes données de Sunday Koura :</p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Envoie un message à un administrateur du groupe en demandant la suppression.</li>
        <li>
          Nous supprimons ton compte, tes inscriptions et tes invités dans un délai de 30 jours.
        </li>
      </ol>
      <p>
        Tu peux aussi retirer l&apos;accès de Sunday Koura dans les paramètres de ton compte
        Facebook (Applications et sites web) ou Google (Sécurité → Applications tierces).
      </p>
    </article>
  );
}
