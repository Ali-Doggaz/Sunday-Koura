export const metadata = { title: "Confidentialité · Sunday Koura" };

export default function PrivacyPage() {
  return (
    <article className="space-y-3 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Politique de confidentialité</h1>
      <p>
        Sunday Koura sert uniquement à organiser des matchs de foot entre amis. Quand tu te
        connectes avec Google ou Facebook, nous enregistrons ton nom, ton adresse e-mail et ta photo
        de profil.
      </p>
      <p>
        Nous enregistrons aussi les matchs auxquels tu t&apos;inscris, les invités que tu ajoutes,
        et l&apos;adresse IP de tes sessions de connexion (pour la sécurité).
      </p>
      <p>
        Ces données ne sont ni vendues ni partagées. Ton nom est visible des autres joueurs sur la
        liste des matchs. Seuls les administrateurs voient ton adresse e-mail.
      </p>
      <p>
        Tu peux demander la suppression de tes données à tout moment : voir la page{" "}
        <a href="/suppression-donnees" className="underline">
          Suppression des données
        </a>
        .
      </p>
    </article>
  );
}
