import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/services/auth.service";
import { computeEmbedding } from "../src/lib/embeddings";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(__dirname, "../uploads");
const MINIATURES_DIR = path.join(__dirname, "seed-miniatures");

/** Article key → PNG in scripts/seed-miniatures/ (filename stem = article key) */
const ARTICLE_MINIATURE_FILES: Partial<Record<string, string>> = {
	revolte: "revolte.png",
	salamine: "salamine.png",
	platees: "platees.png",
	sparte: "sparte.png",
	photosynthese: "photosynthese.png",
	respiration: "respiration.png",
	inflation: "inflation.png",
	camus: "camus.png",
};

async function createPublicMiniature(ownerId: string, articleKey: string) {
	const fileName = ARTICLE_MINIATURE_FILES[articleKey];
	if (!fileName) return undefined;

	const sourcePath = path.join(MINIATURES_DIR, fileName);
	const storedName = `seed-${articleKey}-${Date.now()}.png`;
	const destinationPath = path.join(UPLOADS_DIR, storedName);

	await fs.mkdir(UPLOADS_DIR, { recursive: true });
	const buffer = await fs.readFile(sourcePath);
	await fs.writeFile(destinationPath, buffer);

	const upload = await prisma.upload.create({
		data: {
			ownerId,
			filename: storedName,
			originalName: fileName,
			mimeType: "image/png",
			size: buffer.length,
			visibility: "PUBLIC",
		},
	});
	return upload.id;
}

const PASSWORD = "demo1234";
const DOMAIN = "demo.local";

type Status = "DRAFT" | "SUBMITTED" | "PUBLISHED" | "REJECTED";

const USERS = ["auteur", "historien", "economiste", "biologiste", "litteraire", "informaticien", "relecteur", "lecteur", "nouveau"];

/** faculty per user, for the explore filter demo; reviewer/reader/new accounts have none, they publish nothing */
const USER_FACULTIES: Partial<Record<string, string>> = {
	auteur: "Histoire",
	historien: "Histoire",
	biologiste: "Biologie",
	economiste: "Economie",
	litteraire: "Lettres",
	informaticien: "Informatique",
};

const ARTICLES: { key: string; author: string; title: string; content: string; status: Status }[] = [
	{ key: "revolte", author: "auteur", title: "Darius Ier et la revolte ionienne", status: "PUBLISHED",
		content: `En 499 avant notre ere, les cites grecques d'Ionie, sur la cote d'Asie Mineure, se revoltent contre la domination perse. Depuis une cinquantaine d'annees, elles sont placees sous l'autorite de tyrans qui gouvernent au nom du Grand Roi. Aristagoras de Milet, qui exerce ce pouvoir pour le compte de Darius, decide de se rebeller. Pour obtenir l'aide des cites grecques d'Europe, il se tourne vers Sparte, puis vers Athenes, qui envoie vingt navires, rejointe par Eretrie avec cinq autres.

La premiere action d'envergure est un succes spectaculaire : les Ioniens et leurs allies remontent vers l'interieur et incendient Sardes, la capitale perse de la region. Mais le feu se propage a la ville, et les Atheniens rentrent chez eux peu apres. Cette expedition, plus symbolique que decisive, a des consequences lourdes : Darius promet de punir Athenes et Eretrie.

La revolte dure six ans. Elle se termine par la bataille de Lade, en 494, puis par la destruction de Milet. Ce qui m'intrigue, en relisant Herodote, c'est que la decision d'Athenes d'intervenir dans une affaire ionienne explique en partie la guerre qui suit. Marathon, en 490, n'est donc pas un conflit qui tombe du ciel : c'est la suite logique d'une revolte qui a mal tourne.` },
	{ key: "salamine", author: "auteur", title: "Salamine vue depuis les deux camps", status: "PUBLISHED",
		content: `En 480 avant notre ere, Xerxes lance une armee et une flotte immenses contre la Grece. Sur le papier, la flotte perse ecrase la flotte grecque, et la bataille semble perdue d'avance. Pourtant, c'est a Salamine que la guerre bascule, et l'explication tient en grande partie au terrain.

Le detroit entre l'ile de Salamine et le continent est etroit. Les trieres perses, serrees les unes contre les autres, perdent leur avantage numerique. Themistocle, qui commande la flotte athenienne, aurait fait croire a Xerxes que les Grecs s'apprêtaient a fuir, et l'aurait pousse a engager ses navires dans ce passage. Eschyle, qui a combattu a Salamine, decrit ensuite la defaite dans Les Perses. Herodote raconte aussi que Xerxes observait la bataille depuis une hauteur, et qu'il a vu son armee se faire defaire.

Ce qui me frappe, c'est que la defaite ne detruit pas l'armee perse. Xerxes repart en Asie, mais Mardonios reste en Grece avec une partie des troupes. Salamine change donc le rapport de force sans mettre fin a la guerre. Il faudra encore Platees, en 479, pour terminer les combats sur terre.` },
	{ key: "marathon", author: "auteur", title: "Marathon, 490 : la surprise athenienne", status: "SUBMITTED",
		content: "En 490, a Marathon, les Atheniens affrontent l'armee perse debarquee sur la cote. La victoire athenienne est une surprise, et elle explique en partie la volonte de Darius de punir Athenes." },
	{ key: "brouillon", author: "auteur", title: "Brouillon sur les satrapies", status: "DRAFT",
		content: "Texte en cours de redaction." },
	{ key: "platees", author: "historien", title: "Platees, 479 : la fin de la guerre sur terre", status: "PUBLISHED",
		content: `En 479 avant notre ere, l'armee perse de Mardonios s'est installee pres de Platees, en Beotie. Face a elle, une coalition grecque conduite par le Spartiate Pausanias attend. Pendant plusieurs jours, les deux armees se font face sans combattre, jusqu'a ce que la cavalerie perse tente de franchir les lignes grecques.

La bataille de Platees est decisive. Les Spartiates et les Tegeates font face aux troupes perses, tandis que les autres contingents grecs resistent. Mardonios est tue, et son camp est pris. L'armee perse, privee de son chef, se replie vers l'Asie. Cette victoire termine les combats sur terre, et oblige les Perses a evacuer la Grece.

Ce qui m'interesse dans ce combat, c'est la place qu'y tiennent les cites grecques. Les Atheniens et les Spartiates ne combattent pas toujours ensemble, et la victoire doit beaucoup a la coordination d'une coalition qui se faisait la guerre quelques annees plus tot.` },
	{ key: "sparte", author: "historien", title: "Sparte, Athenes et la ligue hellenique face aux Perses", status: "PUBLISHED",
		content: `En 481 avant notre ere, alors que l'armee de Xerxes se prepare a franchir l'Hellespont, une partie du monde grec tente de s'organiser. Le congres de Corinthe rassemble des cites qui, quelques annees plus tot, se faisaient encore la guerre. Sparte prend la direction des operations terrestres, et Athenes accepte un role second, malgre une flotte bien plus importante.

Cette alliance a des consequences durables. Sparte garde le commandement, et les cites se partagent les taches selon leurs moyens : Athenes fournit l'essentiel des navires, tandis que les cites du Peloponnese et de Beotie fournissent des hoplites. Aux Thermopyles, en 480, Leonidas et ses trois cents Spartiates, accompagnes de quelques contingents, retardent l'armee perse pendant plusieurs jours avant d'etre encercles. La defaite est reelle, mais elle a un effet politique : elle donne a Athenes le temps d'evacuer la ville et de preparer la bataille navale.

On a souvent presente Sparte comme une cite uniquement obsedee par sa propre securite. L'alliance de 481 montre au contraire une capacite a negocier avec des rivaux, et a accepter un partage du commandement, ce qui me semble plus interessant que le mythe des trois cents.` },
	{ key: "ionie", author: "historien", title: "Les cites grecques d'Asie Mineure sous domination perse", status: "PUBLISHED",
		content: `Une question qu'on pose rarement dans les cours sur les guerres mediques : que devenait un Grec de Milet ou d'Ephese sous domination perse ? Les cites ioniennes gardaient une grande partie de leur autonomie. Elles elisaient leurs magistrats et geraient leurs affaires locales, a condition de payer le tribut et de fournir des contingents a l'armee du Grand Roi.

Pour beaucoup d'habitants, la domination perse etait avant tout une contrainte fiscale, plus qu'une oppression culturelle. C'est ce qui rend la revolte de 499 plus compliquee qu'un simple elan patriotique. Elle repond a des tensions locales, entre tyrans soutenus par les Perses et aristocraties qui se sentaient mises a l'ecart. Certaines cites, comme Milet, se rebellent ; d'autres hesitent, negocient ou changent de camp.

En relisant Herodote sur ce point, j'ai surtout retenu le portrait d'un monde grec traverse par des loyautes multiples. Le conflit entre Grecs et Perses n'est pas un bloc contre un bloc, et l'histoire de ces cites le montre tres bien.` },
	{ key: "rejete", author: "historien", title: "Les satrapies perses, sans sources", status: "REJECTED",
		content: "Un texte sur l'organisation administrative de l'empire perse, rejete pour manque de sources." },
	{ key: "photosynthese", author: "biologiste", title: "La photosynthese en premiere annee", status: "PUBLISHED",
		content: "La chlorophylle absorbe surtout le bleu et le rouge. L'energie lumineuse est transferee vers le cycle de Calvin, ou le CO2 est fixe." },
	{ key: "respiration", author: "biologiste", title: "La respiration cellulaire", status: "PUBLISHED",
		content: "La respiration cellulaire libere l'energie des molecules organiques dans les mitochondries, en consommant du dioxygene." },
	{ key: "inflation", author: "economiste", title: "Pourquoi l'inflation a surpris les economistes en 2022", status: "PUBLISHED",
		content: "En 2022, la hausse des prix a surpris une bonne partie des previsionnistes. Une partie de l'explication tient aux chocs d'offre, notamment dans l'energie, et aux goulots d'etranglement hérités de la pandemie." },
	{ key: "taux", author: "economiste", title: "Les taux directeurs et le credit", status: "PUBLISHED",
		content: "Une hausse des taux directeurs ralentit le credit et la demande, mais son effet sur les prix met plusieurs trimestres a se manifester." },
	{ key: "camus", author: "litteraire", title: "Le soleil de Meursault et la fin de L'Etranger", status: "PUBLISHED",
		content: "Le soleil revient souvent dans L'Etranger, et on le lit le plus souvent comme une cause du meurtre. Camus le met pourtant dans une scene de plage ou Meursault est presque indifferent." },
	{ key: "index", author: "informaticien", title: "Pourquoi un index accelere une requete SQL", status: "PUBLISHED",
		content: "Sans index, le moteur parcourt toute la table. Avec un index de type B-tree sur la colonne filtree, il descend directement jusqu'aux bonnes valeurs. L'index a aussi un cout : chaque insertion doit mettre a jour l'arbre." },
];

async function main() {
	if (await prisma.User.findUnique({ where: { email: `auteur@${DOMAIN}` } })) {
		console.log("demo data already present");
		return;
	}

	const users: Record<string, { id: string }> = {};
	for (const name of USERS) {
		users[name] = await prisma.User.create({
			data: { email: `${name}@${DOMAIN}`, name, password: await hashPassword(PASSWORD), faculty: USER_FACULTIES[name] },
		});
	}

	const articles: Record<string, { id: string }> = {};
	for (const a of ARTICLES) {
		const miniatureId = await createPublicMiniature(users[a.author].id, a.key);
		articles[a.key] = await prisma.Article.create({
			data: {
				title: a.title,
				content: a.content,
				abstract: a.content.slice(0, 120),
				authorId: users[a.author].id,
				status: a.status,
				miniatureId,
				embedding: await computeEmbedding(`${a.title}\n${a.content}`),
			},
		});
	}

	const reviews: { article: string; reviewer: string; comment: string; status: "PENDING" | "APPROVED" | "REJECTED" }[] = [
		...["revolte", "salamine", "platees", "sparte", "ionie", "photosynthese", "respiration", "inflation", "taux", "camus", "index"]
			.map((article) => ({ article, reviewer: "relecteur", comment: "Bien documente", status: "APPROVED" as const })),
		{ article: "marathon", reviewer: "relecteur", comment: "Attendre la version finale", status: "PENDING" },
		{ article: "rejete", reviewer: "relecteur", comment: "Sources insuffisantes", status: "REJECTED" },
	];
	for (const r of reviews) {
		await prisma.Review.create({
			data: { articleId: articles[r.article].id, reviewerId: users[r.reviewer].id, comment: r.comment, status: r.status },
		});
	}

	await prisma.Comment.create({
		data: { articleId: articles.revolte.id, authorId: users.lecteur.id, content: "Tres clair, merci." },
	});
	await prisma.Comment.create({
		data: { articleId: articles.salamine.id, authorId: users.historien.id, content: "Complementaire de mon article sur Sparte." },
	});

	await prisma.ArticleLike.create({ data: { articleId: articles.revolte.id, userId: users.lecteur.id } });
	await prisma.ArticleView.create({ data: { articleId: articles.revolte.id, userId: users.lecteur.id } });

	console.log("demo data created");
}

main()
	.catch((error) => {
		console.error("seed failed:", error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
