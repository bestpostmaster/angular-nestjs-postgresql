# CLAUDE.md

Monorepo : `back/` (NestJS 12 + TypeORM/PostgreSQL + BullMQ/Redis) et `front/` (Angular 22 + PrimeNG).

## Règles de codage

Les règles de codage et bonnes pratiques à respecter pour le back et le front sont définies dans **@coding_standards.md**. Les lire avant toute modification et les appliquer systématiquement (architecture, typage, sécurité, tests, accessibilité, migrations, contrat front ↔ back, checklist de fin de tâche).

## Règle essentielle : tout passe par Docker

L'environnement de dev est 100 % dockerisé. **Ne jamais lancer `npm`, `node`, `nest`, `ng`, `psql`… sur l'hôte.** Utiliser `docker compose exec <back|front|postgres|redis> …` depuis la racine (voir `coding_standards.md` §1 et §6).

```bash
make start                                   # lance l'environnement complet
docker compose exec back npm run check       # format + lint + typecheck (back)
docker compose exec back npm test
docker compose exec front npm run check      # idem (front)
docker compose exec front npm test -- --watch=false
```

## Rappels clés

- Back (ESM) : imports relatifs avec extension `.js`, `@Inject(Token)` explicite dans les constructeurs.
- Schéma DB modifié uniquement par migrations (jamais `synchronize`).
- Front : composants standalone, `OnPush`, signals, `@if`/`@for`.
- Pas de `console.log`, de secret en dur, ni de `any` injustifié.
- Une tâche n'est terminée que lorsque `check` et les tests passent dans Docker ; rapporter fidèlement ce qui a été vérifié ou non.
- Commiter ou pousser uniquement sur demande explicite.
