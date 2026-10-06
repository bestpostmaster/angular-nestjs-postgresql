# Workflow `/feature`

Commande : `/feature <besoin et critères d'acceptation>`.

La skill démarre directement `architect-reviewer` (Sonnet) au premier plan.
Il analyse, établit le plan et lance `coder` (Haiku). Le coder implémente et
retourne `IMPLEMENTATION_READY_FOR_REVIEW`. Sonnet inspecte le diff, les fichiers
non suivis et les validations Docker. Il retourne `CHANGES_REQUIRED` au coder
dans la limite de trois cycles, puis `FEATURE_APPROVED` si tout est validé et
s'arrête. L'humain conserve
`git add`, `git commit` et `git push`.

La demande autorise le lancement du coder et les boucles de corrections sans
nouvelle confirmation. Le reviewer tranche les choix techniques courants selon
le code existant, la sécurité et `coding_standards.md`, puis explique sa décision.
La gestion du jeton fait partie de ces choix ; elle ne justifie ni un arbitrage
de l'humain ni une connexion limitée au formulaire et à l'appel API. Les questions
restent réservées aux informations métier indispensables sans choix raisonnable
et aux actions sensibles nécessitant confirmation. Les hooks restent applicables.

`FEATURE_BLOCKED` indique un prérequis manquant, une absence de convergence ou un
budget épuisé ; aucune approbation ne doit être émise dans ce cas.

## Efficacité en tokens et convergence

Sonnet concentre le raisonnement d'architecture et de review ; Haiku réalise le
code, les tests et les corrections. L'exploration est ciblée ; les messages
référencent chemins et symboles sans recopier code, diff ou standards. Les
rapports visent 200 mots maximum, avec les preuves utiles. Sonnet examine le diff
et les fichiers non suivis en tenant compte de l'état initial du dépôt.

Haiku exécute les tests ciblés pendant les itérations. Sonnet exécute les checks
et suites complètes des projets touchés au gate final, avec e2e/build/coverage
selon les standards. Une modification ultérieure invalide les résultats affectés.

Le budget est de trois cycles au total : une implémentation initiale et deux
passes de corrections, chacune suivie d'une review. Le gate final fait partie
du cycle courant. Deux retours sans progrès déclenchent un arrêt anticipé ; après
le troisième cycle non validé, Sonnet retourne `FEATURE_BLOCKED` avec problèmes
restants, tentatives, validations et prochaine action. Il ne relance pas le
workflow sans nouvelle instruction humaine. Cette limite est une consigne des
agents ; les hooks actuels ne comptent pas les cycles.

## Prérequis

- Claude Code 2.1.219 ou ultérieur pour la profondeur configurable des sous-agents.
- Sonnet et Haiku accessibles via le compte Claude.
- `bash`, `jq`, `realpath`, `tr` sur l'hôte pour les hooks.
- Services Docker démarrés par l'humain à la racine du dépôt.
- Redémarrer Claude Code après une modification des agents ou des hooks pour
  garantir le chargement de la configuration complète.

La profondeur est fixée à deux : session → Sonnet → Haiku. Aucun modèle n'est
imposé à la session principale. Ne pas activer une configuration globale qui
force tous les sous-agents sur un même modèle : elle annulerait Sonnet/Haiku.

## Vérifications

```bash
claude --version
claude doctor
bash -n .claude/hooks/*.sh
bash .claude/hooks/guard-subagent.test.sh
docker compose ps
docker compose exec -T back npm run check
docker compose exec -T back npm test
docker compose exec -T front npm run check
docker compose exec -T front npm test -- --watch=false
```

Les hooks sont des scripts d'intégration Claude exécutés sur l'hôte ; les outils
applicatifs et leurs tests restent dans Docker.

## Portée des protections

Le reviewer dispose de la lecture, des validations Docker et de la délégation
au seul coder. Le coder dispose des outils d'édition, des validations, du
formatage et des migrations. Les hooks refusent les autres commandes shell,
les modifications des règles/configurations des agents et les opérations Git
d'écriture. Une dépendance à installer ou une stack arrêtée constitue un blocage
à remonter à l'humain.

La skill contrôle la présence et l'état de la stack avec `docker compose ps`
avant toute délégation. Les manifests/lockfiles, Docker/Compose, la CI et les
règles à tous les niveaux sont protégés en édition. Les migrations versionnées
sont protégées ; les nouvelles migrations non versionnées restent éditables.
Le formatage et les migrations ont des arguments restreints pour éviter une
écriture indirecte vers un fichier protégé. Ces opérations sensibles nécessitent
une intervention humaine dans ce workflow.

Ces hooks constituent des garde-fous de workflow, pas un environnement isolé.
Les scripts npm, configurations de tests, outils Git externes et liens du dépôt
doivent être fiables : des commandes autorisées peuvent exécuter du code du
projet. Le hook Git global filtre les appels Git visibles dans Bash ; il ne
détecte pas une opération cachée dans un script arbitraire de la session
principale. `FEATURE_APPROVED` exprime le verdict du reviewer ; aucun hook ne
prouve à lui seul que tous les critères fonctionnels sont satisfaits.

Documentation officielle : [skills](https://code.claude.com/docs/en/skills),
[sous-agents](https://code.claude.com/docs/en/sub-agents),
[hooks](https://code.claude.com/docs/en/hooks).

## Audit du 6 octobre 2026

Test réel avec Claude Code 2.1.292 : `/feature` a démarré Sonnet 5.5, qui a
délégué à Haiku 4.5 la lecture des scripts npm et l'inspection Docker. Haiku a
retourné `IMPLEMENTATION_READY_FOR_REVIEW`, puis Sonnet a contrôlé le retour et
terminé le test avec `FEATURE_APPROVED`. Les événements des hooks n'indiquaient
aucun refus de permission. Aucun fichier applicatif n'a été modifié par ce test.
Il valide le lancement, les modèles, la délégation et les outils de lecture ;
il ne teste pas une implémentation complète ni une boucle réelle de corrections.

Les tests des hooks, la syntaxe Bash, les checks back/front et les trois tests
front passent. Les tests back comptent quatre succès et un échec existant dans
`back/src/app.controller.spec.ts:19` : le test attend `NestJS/Angular`, alors que
le service renvoie une description détaillée des versions. Une feature touchant
le back ne doit pas être approuvée sans traiter ou expliquer ce blocage.
