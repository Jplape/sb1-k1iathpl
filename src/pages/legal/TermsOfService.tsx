import React from 'react';

export function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 prose dark:prose-invert">
      <h1>Conditions Générales d'Utilisation</h1>
      <p className="text-sm text-gray-500">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <section>
        <h2>1. Mentions Légales</h2>
        <p>
          Le site web Marketplace est édité par [Nom de la société], société [forme juridique] au capital de [montant] euros,
          immatriculée au Registre du Commerce et des Sociétés de [ville] sous le numéro [numéro RCS],
          dont le siège social est situé [adresse].
        </p>
        <p>
          Directeur de la publication : [Nom du directeur]<br />
          Contact : [email]<br />
          Téléphone : [numéro]
        </p>
        <p>
          Le site est hébergé par [Nom de l'hébergeur], [adresse de l'hébergeur].
        </p>
      </section>

      <section>
        <h2>2. Conditions d'Utilisation du Service</h2>
        
        <h3>2.1. Accès au Service</h3>
        <p>
          L'accès au service est réservé aux utilisateurs disposant d'un compte personnel.
          L'inscription est gratuite et nécessite la fourniture d'informations exactes et à jour.
          L'utilisateur s'engage à ne pas créer de fausse identité et à ne pas usurper l'identité d'un tiers.
        </p>

        <h3>2.2. Compte Utilisateur</h3>
        <p>
          L'utilisateur est responsable de la confidentialité de ses identifiants de connexion.
          Toute utilisation du service effectuée avec ses identifiants sera présumée avoir été effectuée par l'utilisateur lui-même.
          En cas de perte ou de vol des identifiants, l'utilisateur doit immédiatement en informer le service client.
        </p>

        <h3>2.3. Utilisation du Service</h3>
        <p>
          L'utilisateur s'engage à utiliser le service de manière loyale et conformément aux présentes conditions.
          Sont notamment interdits :
        </p>
        <ul>
          <li>La publication de contenus illégaux ou frauduleux</li>
          <li>Le harcèlement d'autres utilisateurs</li>
          <li>La collecte non autorisée d'informations sur les autres utilisateurs</li>
          <li>Toute action visant à perturber le fonctionnement du service</li>
        </ul>
      </section>

      <section>
        <h2>3. Protection des Données Personnelles</h2>
        
        <h3>3.1. Collecte des Données</h3>
        <p>
          Nous collectons et traitons les données personnelles des utilisateurs conformément à notre Politique de Confidentialité
          et au Règlement Général sur la Protection des Données (RGPD).
        </p>

        <h3>3.2. Finalités du Traitement</h3>
        <p>
          Les données personnelles sont collectées pour :
        </p>
        <ul>
          <li>La gestion des comptes utilisateurs</li>
          <li>La fourniture des services demandés</li>
          <li>L'amélioration de nos services</li>
          <li>La communication avec les utilisateurs</li>
          <li>Le respect de nos obligations légales</li>
        </ul>

        <h3>3.3. Droits des Utilisateurs</h3>
        <p>
          Conformément au RGPD, les utilisateurs disposent des droits suivants :
        </p>
        <ul>
          <li>Droit d'accès à leurs données personnelles</li>
          <li>Droit de rectification des données inexactes</li>
          <li>Droit à l'effacement des données</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit à la portabilité des données</li>
          <li>Droit d'opposition au traitement</li>
        </ul>
      </section>

      <section>
        <h2>4. Propriété Intellectuelle</h2>
        <p>
          L'ensemble des éléments du site (textes, images, logos, base de données, etc.) est protégé par le droit
          de la propriété intellectuelle. Toute reproduction, représentation ou diffusion, en tout ou partie,
          du contenu de ce site sur quelque support que ce soit est interdite sans l'autorisation expresse
          du titulaire des droits.
        </p>
        <p>
          Les marques et logos figurant sur le site sont des marques déposées par leurs propriétaires respectifs.
          Toute reproduction ou représentation de ces marques sans autorisation expresse est constitutive de contrefaçon.
        </p>
      </section>

      <section>
        <h2>5. Responsabilités et Garanties</h2>
        
        <h3>5.1. Responsabilité de la Plateforme</h3>
        <p>
          La plateforme s'efforce d'assurer au mieux de ses possibilités l'exactitude et la mise à jour des informations
          diffusées, dont elle se réserve le droit de corriger le contenu à tout moment. Toutefois, elle ne peut garantir
          l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur le site.
        </p>

        <h3>5.2. Responsabilité des Utilisateurs</h3>
        <p>
          Les utilisateurs sont seuls responsables du contenu qu'ils publient sur la plateforme. Ils garantissent
          détenir les droits nécessaires à la publication de leur contenu et s'engagent à respecter les droits des tiers.
        </p>

        <h3>5.3. Limitation de Responsabilité</h3>
        <p>
          La plateforme ne pourra être tenue responsable des dommages directs ou indirects résultant de l'utilisation
          du service, notamment en cas d'interruption ou de dysfonctionnement du service.
        </p>
      </section>

      <section>
        <h2>6. Modification des CGU</h2>
        <p>
          La plateforme se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
          informés des modifications par tout moyen approprié. La continuation de l'utilisation du service après
          modification des CGU vaut acceptation des nouvelles conditions.
        </p>
      </section>

      <section>
        <h2>7. Loi Applicable et Juridiction</h2>
        <p>
          Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux français seront
          seuls compétents. Préalablement à toute action en justice, les parties s'engagent à rechercher une
          solution amiable.
        </p>
        <p>
          Pour tout litige relatif à l'utilisation du service, le tribunal de commerce de [ville] sera seul compétent.
        </p>
      </section>
    </div>
  );
}