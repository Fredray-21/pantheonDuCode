# Utilisez une image de base avec Node.js pré-installé
FROM node:20

# Définissez le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copiez les fichiers package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installez les dépendances
RUN npm install

# Copiez tous les fichiers de l'application dans le répertoire de travail du conteneur
COPY . .

# Exposez le port sur lequel votre bot Discord écoute (par exemple, 8080)
EXPOSE 4567

RUN npm run build

# Commande pour démarrer votre application Discord
CMD ["npm", "run", "start"]
