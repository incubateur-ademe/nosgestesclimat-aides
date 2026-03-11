## Description

Service exposant via API le référentiel des aides locales et nationales autour de la transition écologique

## Pile technique.

- Language : nodejs (>=22)
- TypeScript
- [PostgreSQL](https://www.postgresql.org/) 16 en base de données
- ORM Prisma
- [NestJS](https://nestjs.com/) framework principale (controlers,
  injection de dépendances, ...)
- [Jest](https://jestjs.io/) pour le framework de tests

## Installation locale

```bash
$ npm install
```

## Configuration de la base de données locale

Le backend a besoin d'une instance Postgresql (v16) pour s'exécuter, également une instance pour exécuter l'ensemble des tests d'intégration

Vous êtes libre de configuer en local ces instance selon vos préférences :

- via une installation standalone de Postgresql (plus efficace en terme de ressources)
  - sous Mac https://postgresapp.com fonctionne très bien par exemple
- via docker

### Paramétrage des URLs de BDD

- Dupliquer le fichier `.env.run.sample` en `.env.run`, le remplir, ce fichier est utilisé pour les run local du back, cad `npm run start:dev`
  - ce fichier permet notamment de pointer une base dédiée au run local de l'application
  - cette base est pérènne, stable en terme de contenu d'une exécution à l'autre
- Dupliquer le fichier `.env.test.sample` en `.env.test`, le remplir, ce fichier est utilisé pour les lignes de commande de test, eg. `npm run test`
  - ce fichier permet notamment de pointer une base dédiée aux tests d'intégration
  - cette base est volatile, vidée à chaque cas de test
- renseigner les URLs respectives de votre base de test et votre base de run

### Lancer la première génération de classes "client prisma"

```bash
npm run db:generate
```

### Lancer les migrations sur les bases de dev et tests

Cette procédure joue l'ensemble des script SQL permettant d'avoir la dernière version du schema SQL de l'application

```bash
npm run db:migrate
```

### Lancer les tests d'intégration et les tests unitaires

Pour vérifier que tout marche bien

```bash
npm run test # pour tous les tests , unitaires ET intégration
```

```bash
npm run test:int # pour les tests d'intégration seuls
```

```bash
npm run test:unit # pour les tests unitaires seuls
```

## Lancer l'application

```bash

# start backend
$ npm run start

ou bien

# watch mode
$ npm run start:dev

```
