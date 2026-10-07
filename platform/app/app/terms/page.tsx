import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";

export const metadata: Metadata = {
  title: "Conditions d'utilisation - OpenScholar",
  description: "Règles d'utilisation d'OpenScholar.",
};

export default function TermsPage() {
  return (
    <PageShell width="default" offset="sm">
      <PageHeading
        title="Conditions d'utilisation"
        description="Dernière mise à jour : 6 octobre 2026"
      />

      <div className="legal-content">
        <section>
          <h2>1. Acceptation des conditions</h2>
          <p>
            En créant un compte ou en utilisant OpenScholar, vous acceptez les présentes
            conditions d&apos;utilisation et notre{" "}
            <Link href="/privacy">Politique de confidentialité</Link>. Si vous n&apos;acceptez
            pas ces conditions, veuillez ne pas utiliser la plateforme.
          </p>
        </section>

        <section>
          <h2>2. Le service</h2>
          <p>
            OpenScholar est une plateforme de publication académique créée dans le cadre d&apos;un
            projet étudiant (cursus 42, ft_transcendence). Elle permet aux utilisateurs de
            rédiger et publier des articles, de les soumettre à la relecture par les pairs, de
            relire et commenter le travail d&apos;autres personnes, d&apos;ajouter des amis et
            d&apos;échanger des messages privés en temps réel. Le service est fourni gratuitement,
            à des fins pédagogiques, et peut évoluer ou être interrompu à tout moment.
          </p>
        </section>

        <section>
          <h2>3. Votre compte</h2>
          <ul>
            <li>Vous devez fournir une adresse e-mail valide et des informations exactes.</li>
            <li>
              Vous êtes responsable de la confidentialité de votre mot de passe et de toute
              activité sur votre compte. Nous recommandons d&apos;activer l&apos;authentification
              à deux facteurs.
            </li>
            <li>Vous ne devez pas usurper l&apos;identité d&apos;un autre utilisateur ou d&apos;un chercheur réel.</li>
            <li>
              Si vous vous connectez avec GitHub, vous devez également respecter les conditions
              d&apos;utilisation de GitHub.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Publication et relecture</h2>
          <ul>
            <li>
              Vous ne pouvez publier que du contenu que vous avez rédigé vous-même ou que vous
              avez le droit de partager. Le plagiat, la fabrication de données et la violation
              du droit d&apos;auteur sont interdits.
            </li>
            <li>
              Les articles soumis passent par un processus de relecture et peuvent être approuvés
              ou rejetés. Un article rejeté n&apos;est pas publié.
            </li>
            <li>
              Les relectures doivent être honnêtes, constructives et centrées sur le travail, et
              non sur l&apos;auteur.
            </li>
            <li>
              Les fichiers téléversés (images et PDF) doivent respecter les types et tailles
              autorisés et ne doivent pas contenir de code malveillant.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Échanges, commentaires et règles de la communauté</h2>
          <p>Lors de vos échanges avec d&apos;autres utilisateurs, vous vous engagez à ne pas :</p>
          <ul>
            <li>Harceler, menacer, insulter ou discriminer quiconque.</li>
            <li>Publier du contenu haineux, violent, sexuel ou illégal.</li>
            <li>Envoyer du spam, de la publicité ou des messages en masse non sollicités.</li>
            <li>Partager les informations personnelles d&apos;autrui sans leur consentement.</li>
            <li>
              Tenter de compromettre, surcharger ou contourner la sécurité de la plateforme, ou
              d&apos;accéder à des données qui ne vous appartiennent pas.
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Propriété intellectuelle</h2>
          <p>
            Vous conservez la propriété des articles, relectures, commentaires et fichiers que
            vous publiez. En publiant du contenu, vous autorisez OpenScholar à le stocker et à
            l&apos;afficher aux autres utilisateurs au sein de la plateforme. Vous pouvez supprimer
            vos brouillons non publiés à tout moment.
          </p>
        </section>

        <section>
          <h2>7. Utilisation de l&apos;API</h2>
          <p>
            Si vous générez une clé API, vous êtes responsable de la garder secrète. L&apos;API
            est soumise à des limites de débit ; un usage abusif peut entraîner la révocation
            de la clé.
          </p>
        </section>

        <section>
          <h2>8. Modération et résiliation</h2>
          <p>
            Nous pouvons retirer du contenu ou suspendre des comptes en cas de violation de ces
            conditions, sans préavis. Vous pouvez cesser d&apos;utiliser OpenScholar à tout moment
            et demander la suppression de votre compte en écrivant à{" "}
            <a href="mailto:openscholar.team42@gmail.com">openscholar.team42@gmail.com</a> (voir
            la <Link href="/privacy">Politique de confidentialité</Link>).
          </p>
        </section>

        <section>
          <h2>9. Responsabilité</h2>
          <p>
            OpenScholar est un projet étudiant fourni « en l&apos;état », sans garantie de
            disponibilité ou d&apos;exactitude. Le contenu publié par les utilisateurs relève de
            la seule responsabilité de ses auteurs et ne reflète pas l&apos;opinion de
            l&apos;équipe OpenScholar. Nous ne sommes pas responsables des pertes de données ou
            des dommages résultant de l&apos;utilisation de la plateforme.
          </p>
        </section>

        <section>
          <h2>10. Modifications des conditions</h2>
          <p>
            Nous pouvons mettre à jour ces conditions au fil de l&apos;évolution de la
            plateforme. La date en haut de cette page indique la dernière modification.
            Continuer à utiliser OpenScholar après une modification vaut acceptation des
            nouvelles conditions.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
