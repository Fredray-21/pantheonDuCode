import random

# Variables pour stocker des informations utilisateur
utilisateur_nom = ""
contexte_utilisateur = {}

# Chargement d'un dictionnaire de mots depuis un fichier texte
def charger_dictionnaire(fichier, encodage='iso-8859-1'):
    with open(fichier, 'r', encoding=encodage) as f:
        mots = f.read().splitlines()  # Lire les mots ligne par ligne
    return mots

# Fonction qui classe les mots en noms, verbes, etc. (simplifié)
def classer_mots(dictionnaire):
    mots_classe = {
        "noms": [],
        "verbes": [],
        "adjectifs": [],
        "autres": []
    }

    for mot in dictionnaire:
        if mot.endswith("er") or mot.endswith("ir"):  # Simplification pour identifier les verbes
            mots_classe["verbes"].append(mot)
        elif mot.endswith("e") or mot.endswith("ion"):  # Simplification pour les noms
            mots_classe["noms"].append(mot)
        elif mot.endswith("eux") or mot.endswith("ible"):  # Simplification pour les adjectifs
            mots_classe["adjectifs"].append(mot)
        else:
            mots_classe["autres"].append(mot)

    return mots_classe

# Fonction qui génère des réponses plus naturelles
def generer_reponse(entree_utilisateur, mots_classe):
    entree_mots = entree_utilisateur.split()

    # Détection de questions
    if any(mot in entree_utilisateur for mot in ["qui", "quoi", "où", "comment", "pourquoi"]):
        return "C'est une excellente question ! Que voulez-vous savoir exactement ?"

    # Chercher les mots dans l'entrée
    found_noms = [mot for mot in entree_mots if mot in mots_classe["noms"]]
    found_verbes = [mot for mot in entree_mots if mot in mots_classe["verbes"]]
    found_adjectifs = [mot for mot in entree_mots if mot in mots_classe["adjectifs"]]

    # Construction de la réponse
    reponse = ""
    if found_verbes:
        reponse += f"Vous avez mentionné que vous souhaitez {', '.join(found_verbes)}. "

    if found_noms:
        reponse += f"Et vous parlez aussi de {', '.join(found_noms)}. "

    if found_adjectifs:
        reponse += f"Vous avez utilisé des mots comme {', '.join(found_adjectifs)}. "

    if not found_noms and not found_verbes and not found_adjectifs:
        reponse = "Je ne suis pas sûr de comprendre, pourriez-vous clarifier ?"
    else:
        reponse += "Comment puis-je vous aider davantage ?"

    return reponse

# Fonction améliorée qui analyse les phrases et utilise le dictionnaire
def repondre_utilisateur(entree_utilisateur, mots_classe):
    global utilisateur_nom, contexte_utilisateur

    # Convertir l'entrée en minuscules pour la comparaison
    entree_utilisateur = entree_utilisateur.lower().strip()

    # Mémorisation du nom de l'utilisateur si l'utilisateur se présente
    if "je m'appelle" in entree_utilisateur:
        utilisateur_nom = entree_utilisateur.split()[-1]  # Prendre le dernier mot comme nom
        contexte_utilisateur['nom'] = utilisateur_nom
        return f"Ravi de vous rencontrer, {utilisateur_nom} !"

    # Personnalisation si on connaît le nom
    if utilisateur_nom:
        if "salut" in entree_utilisateur or "bonjour" in entree_utilisateur:
            return f"Salut {utilisateur_nom}, comment puis-je vous aider aujourd'hui?"

    # Analyser les mots et générer une réponse
    reponse = generer_reponse(entree_utilisateur, mots_classe)
    return reponse

# Boucle principale du chatbot
def lancer_chatbot():
    print("Chatbot: Bonjour! Posez-moi une question ou tapez 'au revoir' pour quitter.")

    # Charger le dictionnaire
    dictionnaire = charger_dictionnaire('dictionnaire.txt')

    # Classer les mots
    mots_classe = classer_mots(dictionnaire)

    while True:
        # Récupérer l'entrée utilisateur
        entree = input("Vous: ")

        # Condition de sortie
        if entree.lower() == "au revoir":
            print("Chatbot: Au revoir!")
            break

        # Obtenir la réponse du chatbot
        reponse = repondre_utilisateur(entree, mots_classe)

        # Afficher la réponse
        print("Chatbot:", reponse)

# Lancer le chatbot
lancer_chatbot()
