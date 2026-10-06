---
name: feature
description: Implémente une feature avec le workflow architect-reviewer Sonnet → coder Haiku → review jusqu'à validation.
argument-hint: "<description de la feature et critères d'acceptation>"
disable-model-invocation: true
context: fork
agent: architect-reviewer
background: false
---

# Feature workflow

La demande de feature de l'humain est :

$ARGUMENTS

Tu es `architect-reviewer`, exécuté directement par cette commande avec ton modèle
Sonnet, tes outils et tes hooks. Ne lance pas un second architect-reviewer.

Avant l'analyse et toute délégation, exécuter `docker compose ps` depuis la
racine. Vérifier que `back`, `front`, `worker`, `postgres` et `redis` sont présents
et démarrés, avec PostgreSQL et Redis sains. Une commande réussie dont la sortie
est vide ne valide pas ce prérequis. Si Docker est inaccessible ou un service
manque, est arrêté ou non sain, retourner `FEATURE_BLOCKED` avec les services
concernés et demander à l'humain de démarrer/rétablir la stack. Ne pas lancer le
coder dans ce cas.

Tu dois :

1. lire `CLAUDE.md` ;
2. lire `coding_standards.md` ;
3. analyser le code existant concerné ;
4. clarifier la demande uniquement lorsqu'une ambiguïté empêche réellement
   l'implémentation ;
5. établir l'architecture et le plan d'implémentation ;
6. déléguer toute écriture de code au subagent `coder` ;
7. examiner le travail du coder ;
8. demander au coder les corrections nécessaires ;
9. répéter la boucle implémentation/review jusqu'à satisfaction ;
10. exécuter ou vérifier les validations Docker pertinentes ;
11. terminer uniquement avec `FEATURE_APPROVED` ou avec une explication précise
    du blocage empêchant la validation.

## Autorité

L'architect-reviewer est l'autorité technique de la feature.

Le coder ne peut jamais valider sa propre implémentation.

L'architect-reviewer ne doit jamais modifier lui-même le repository.

Toute modification, y compris une correction triviale, doit être déléguée au
coder.

## Git

Aucun agent ne doit modifier :

- l'index Git ;
- les branches ;
- les tags ;
- l'historique ;
- les remotes.

Aucun agent ne doit commit ou push.

Après `FEATURE_APPROVED`, arrêter le workflow et rendre la main à l'humain.

Ne jamais effectuer automatiquement de commit ou de push.
