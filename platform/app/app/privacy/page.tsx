import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";

export const metadata: Metadata = {
  title: "Politique de confidentialité - OpenScholar",
  description: "Comment OpenScholar collecte, utilise et protège vos données personnelles.",
};

export default function PrivacyPage() {
  return (
    <PageShell width="default" offset="sm">
      <PageHeading
        title="Politique de confidentialité"
        description="Dernière mise à jour : 6 octobre 2026"
      />

      <div className="legal-content">
        <section>
          <h2>1. Qui sommes-nous</h2>
          <p>
            OpenScholar est une plateforme de publication académique développée par une équipe
            d&apos;étudiants dans le cadre du cursus 42 (projet ft_transcendence). Elle permet
            aux chercheurs et aux étudiants de publier des articles, de relire le travail
            d&apos;autres personnes, de commenter, d&apos;ajouter des amis et d&apos;échanger en
            temps réel. La présente politique explique quelles données personnelles nous
            traitons lorsque vous utilisez OpenScholar, pourquoi nous les traitons et quels
            droits vous avez à leur égard.
          </p>
        </section>

        <section>
          <h2>2. Données que nous collectons</h2>
          <h3>Données de compte</h3>
          <ul>
            <li>Votre adresse e-mail et votre nom affiché.</li>
            <li>
              Votre mot de passe, qui n&apos;est jamais stocké en clair : il est haché et
              salé avec bcrypt avant d&apos;être enregistré.
            </li>
            <li>
              Si vous vous connectez avec GitHub (OAuth 2.0) : l&apos;identifiant de votre
              compte GitHub, votre nom public et votre adresse e-mail tels que fournis par
              GitHub. Nous ne recevons jamais votre mot de passe GitHub.
            </li>
            <li>
              Si vous activez l&apos;authentification à deux facteurs : le secret utilisé pour
              générer vos codes à usage unique.
            </li>
          </ul>

          <h3>Données de profil</h3>
          <ul>
            <li>Votre avatar, si vous en téléversez un (un avatar par défaut est utilisé sinon).</li>
            <li>Votre faculté et votre spécialisation, si vous choisissez de les renseigner.</li>
            <li>La date de création de votre compte.</li>
          </ul>

          <h3>Contenu que vous créez</h3>
          <ul>
            <li>
              Articles (titre, résumé, contenu), leur miniature et les fichiers PDF joints.
            </li>
            <li>Relectures et commentaires que vous rédigez sur les articles.</li>
            <li>Fichiers téléversés et leurs métadonnées (nom, type, taille).</li>
          </ul>

          <h3>Activité de lecture</h3>
          <ul>
            <li>Les articles que vous ouvrez (chaque article est enregistré une fois par utilisateur).</li>
            <li>Les articles que vous aimez.</li>
          </ul>

          <h3>Données sociales et de messagerie</h3>
          <ul>
            <li>Vos demandes d&apos;amis et votre liste d&apos;amis.</li>
            <li>
              Vos messages privés, les conversations auxquelles vous participez et l&apos;état
              de lecture des messages.
            </li>
            <li>
              Votre statut en ligne, calculé à partir de votre connexion active et non
              conservé de façon permanente.
            </li>
          </ul>

          <h3>Données techniques</h3>
          <ul>
            <li>
              Un cookie de session (<code>connect.sid</code>) qui maintient votre connexion.
              Il est strictement nécessaire au fonctionnement du service.
            </li>
            <li>Les clés API que vous générez, stockées uniquement sous forme de hachage.</li>
          </ul>
        </section>

        <section>
          <h2>3. Comment nous utilisons vos données</h2>
          <ul>
            <li>Pour créer et sécuriser votre compte et vous authentifier.</li>
            <li>Pour afficher votre profil et vos publications aux autres utilisateurs.</li>
            <li>
              Pour faire fonctionner la relecture, les commentaires, le système d&apos;amis et
              la messagerie en temps réel.
            </li>
            <li>Pour indiquer à vos amis si vous êtes en ligne.</li>
            <li>
              Pour vous recommander des articles susceptibles de vous intéresser : les articles
              que vous ouvrez, aimez, commentez ou relisez sont comparés à d&apos;autres articles
              par un algorithme exécuté sur notre propre serveur. Aucune donnée n&apos;est
              transmise à un tiers à cette fin.
            </li>
            <li>Pour prévenir les abus et maintenir la sécurité de la plateforme.</li>
          </ul>
          <p>
            Nous ne vendons pas vos données, nous ne les utilisons pas à des fins publicitaires
            et nous n&apos;utilisons pas de cookies de suivi ou d&apos;analyse.
          </p>
        </section>

        <section>
          <h2>4. Qui peut voir vos données</h2>
          <ul>
            <li>
              <strong>Public :</strong> votre nom, avatar, faculté, spécialisation, articles
              publiés, relectures et commentaires sont visibles par les autres utilisateurs.
            </li>
            <li>
              <strong>Restreint :</strong> les brouillons et articles non publiés ne sont
              visibles que par vous (et par les relecteurs une fois soumis). Les fichiers privés
              ne sont accessibles qu&apos;à leur propriétaire.
            </li>
            <li>
              <strong>Privé :</strong> les messages d&apos;échange ne sont visibles que par les
              participants à la conversation. Votre adresse e-mail, l&apos;empreinte de votre
              mot de passe et le secret de la double authentification ne sont jamais affichés
              aux autres utilisateurs.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Cookies</h2>
          <p>
            OpenScholar n&apos;utilise qu&apos;un cookie de session, nécessaire pour maintenir
            votre connexion. Il expire au bout de 7 jours ou lorsque vous vous déconnectez.
            Aucun cookie tiers, publicitaire ou de suivi n&apos;est utilisé.
          </p>
        </section>

        <section>
          <h2>6. Sécurité</h2>
          <p>
            Toutes les connexions entre votre navigateur et OpenScholar utilisent HTTPS. Les
            mots de passe sont hachés et salés, les clés API sont hachées, et l&apos;accès aux
            ressources privées est contrôlé côté serveur. L&apos;authentification à deux facteurs
            optionnelle renforce la protection de votre compte. Lors de la déconnexion, votre
            session et les connexions en temps réel sont fermées.
          </p>
        </section>

        <section>
          <h2>7. Conservation des données</h2>
          <p>
            Vos données sont conservées tant que votre compte existe. Les données de session
            sont supprimées lorsque vous vous déconnectez ou lorsque la session expire. Si votre
            compte est supprimé, vos données personnelles, amitiés et conversations sont
            effacées ; le contenu publié publiquement peut être conservé de forme anonymisée
            pour préserver l&apos;intégrité des échanges et des relectures.
          </p>
        </section>

        <section>
          <h2>8. Vos droits</h2>
          <p>
            Vous pouvez consulter et mettre à jour la plupart de vos informations personnelles
            depuis votre tableau de bord. Si vous souhaitez que votre compte et vos données
            personnelles soient supprimés, ou si vous avez une question concernant vos données,
            contactez l&apos;équipe OpenScholar à{" "}
            <a href="mailto:openscholar.team42@gmail.com">openscholar.team42@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2>9. Modifications de cette politique</h2>
          <p>
            Nous pouvons mettre à jour cette politique au fil de l&apos;évolution de la
            plateforme. La date en haut de cette page indique la dernière modification.
            Consultez également nos{" "}
            <Link href="/terms">Conditions d&apos;utilisation</Link>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
