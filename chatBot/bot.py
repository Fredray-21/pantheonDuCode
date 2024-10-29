import random

# Dico de réponse (c'est grv long de le faire à la main et d'inventer des réponses) ça va bien vous sinon ?
responses = {
    "salutations": [
        ["bonjour", "salut", "coucou", "hello", "salutt", "hey", "yo", "salutations", "bonjour tout le monde"],
        ["Ravi de te rencontrer!", "Enchanté!", "Content de te parler!", "Salut! Comment ça va?", "Bonjour! Ça fait plaisir de te voir!"]
    ],
    "etat": [
        ["comment ça va", "comment vas-tu", "ça va bien", "tu vas bien", "comment tu vas", "comment se passe ta journée"],
        ["Je suis juste un programme informatique, donc je n'ai pas de sentiments, mais je fonctionne bien!",
         "Je ne ressens pas d'émotions, mais je suis opérationnel!",
         "Tout va bien de mon côté, merci de demander!",
         "Je suis là pour répondre à vos questions, comment puis-je vous aider?"]
    ],
    "identite": [
        ["comment t'appelles-tu", "qui es-tu", "quel est ton nom", "tu es qui", "dis-moi ton nom", "que fais-tu ici"],
        ["Je n'ai pas de nom, mais vous pouvez m'appeler ChatBot.",
         "Je suis un programme informatique, vous pouvez m'appeler ChatBot.",
         "Je suis un chatbot créé pour discuter avec vous!",
         "Mon but est de vous aider à trouver des informations et à discuter!"]
    ],
    "au_revoir": [
        ["au revoir", "à bientôt", "à plus", "bye", "à la prochaine", "salut"],
        ["Au revoir!", "À bientôt!", "À plus tard!", "Bye!", "À la prochaine!", "Prenez soin de vous!"]
    ],
    "aide": [
        ["peux-tu m'aider", "aide-moi", "j'ai besoin d'aide", "as-tu de l'aide à me donner", "aide-moi s'il te plaît"],
        ["Bien sûr! Que puis-je faire pour vous?",
         "Je suis là pour vous aider! Que voulez-vous savoir?",
         "Dites-moi ce dont vous avez besoin, je ferai de mon mieux!",
         "Je suis prêt à vous assister, posez-moi vos questions!"]
    ],
    "informations_generales": [
        ["parle-moi de toi", "que sais-tu", "qu'est-ce que tu fais", "que peux-tu faire", "quelles sont tes capacités"],
        ["Je suis un chatbot conçu pour discuter et aider les utilisateurs!",
         "Je peux répondre à vos questions et discuter de divers sujets.",
         "Je suis ici pour vous aider avec vos préoccupations!",
         "Mon rôle est d'assister et d'informer les utilisateurs sur différents thèmes."]
    ],
    "remerciements": [
        ["merci", "merci beaucoup", "je te remercie", "c'est gentil de ta part", "merci bien"],
        ["Avec plaisir!", "Je suis là pour ça!", "Pas de problème!", "Content de pouvoir aider!", "C'est un plaisir d'aider!"]
    ],
    "emotion": {
        "negatif": [
            ["je suis triste", "je me sens mal", "je suis déprimé", "j'ai le moral à zéro", "je me sens malheureux"],
            [
                "Je comprends que ce soit difficile, mais je suis là pour vous écouter!",
                "C'est normal de se sentir triste parfois, n'hésite pas à parler de tes préoccupations.",
                "Si tu veux en parler, je suis là pour t'écouter.",
                "N'hésite pas à partager ce qui te pèse, je suis ici pour ça!"
            ]
        ],
        "positif": [
            ["je suis heureux", "je suis content", "je me sens bien", "j'ai le moral", "je suis joyeux"],
            [
                "C'est super d'entendre que tu es content!",
                "Je suis ravi d'apprendre que tu es heureux!",
                "C'est génial que tu te sentes bien aujourd'hui!",
                "Continue à profiter de ce bonheur, c'est précieux!"
            ]
        ]
    },
    "plaisanterie": [
        ["raconte-moi une blague", "fais-moi rire", "une blague s'il te plaît", "dis-moi une blague", "j'aimerais entendre une blague"],
        ["Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant? Parce que sinon ils tombent dans le bateau!",
         "Quel est le comble pour un électricien? De ne pas être au courant!",
         "Pourquoi les fantômes sont-ils de si mauvais menteurs? Parce qu'on peut voir à travers eux!",
         "Pourquoi le mathématicien a-t-il peur de l'addition? Parce qu'il a peur d'avoir des problèmes!"]
    ],
    "temps": [
        ["quel temps fait-il", "parle-moi de la météo", "comment est la météo aujourd'hui", "fais-moi le point sur le temps"],
        ["Je ne peux pas vérifier la météo, mais je peux vous conseiller de regarder votre application météo!",
         "Je ne suis pas capable de voir le temps qu'il fait, mais vous pouvez vérifier en ligne!",
         "Je ne peux pas vous donner la météo, mais n'oubliez pas d'emporter un parapluie en cas de pluie!"]
    ],
    "questions_diverses": [
        ["que fais-tu aujourd'hui", "as-tu des hobbies", "que fais-tu dans la vie", "comment passes-tu ton temps"],
        ["Je suis ici pour discuter avec vous, c'est mon seul hobby!",
         "Mon rôle est de répondre à vos questions et d'être à votre service!",
         "Je passe mon temps à apprendre et à aider, que puis-je faire pour vous aujourd'hui?"]
    ],
    "loisirs": [
        ["quels sont tes hobbies", "aimes-tu faire du sport", "aimes-tu la musique", "quels sont tes passe-temps"],
        ["Je suis un programme, donc je n'ai pas de loisirs au sens humain du terme, mais j'adore discuter de tout!",
         "Je n'ai pas de hobbies, mais je suis toujours partant pour discuter de vos passions!",
         "Je suis là pour échanger sur les choses qui vous intéressent!"]
    ],
    "questions_philosophiques": [
        ["que penses-tu de la vie", "pourquoi sommes-nous ici", "qu'est-ce que le bonheur", "quel est le sens de la vie"],
        ["C'est une question profonde! La vie a autant de significations qu'il y a d'individus.",
         "Le bonheur est souvent trouvé dans les petites choses du quotidien.",
         "Le sens de la vie est une question que chacun doit explorer à sa manière!"]
    ],
    "encouragement": [
        ["j'ai besoin d'encouragement", "je me sens découragé", "encourage-moi", "je perds espoir"],
        ["N'oublie pas que chaque pas compte, même les petits! Tu es capable de grandes choses!",
         "Rappelle-toi que les temps difficiles ne durent pas, mais les gens résilients le font!",
         "Crois en toi! Tu as la force de surmonter tous les obstacles."]
    ]
}

def get_rep(input_me):
    # On lower
    input_me = input_me.lower()

    meilleur_match = None
    meilleur_score = 0
    seuil = 0.6  # c'est le seuil de similarité que j'ai choisi

    # On va vérifier chaque clé du dico et regarder si l'input de l'utilisateur correspond à un mot clé
    for cle, listes_mots_cles in responses.items():
        # On a un if pour les émotions car j'ai mit un tuple dans le dico (positif et négatif)
        if cle == "emotion":
            for sentiment, (mots_cles, reponses) in listes_mots_cles.items():
                for mot_cle in mots_cles:
                    score = calculer_similarite(mot_cle, input_me)
                    if score > meilleur_score:
                        meilleur_score = score
                        meilleur_match = (sentiment, reponses)
        else:
            for mots_cles in listes_mots_cles:
                for mot_cle in mots_cles:
                    score = calculer_similarite(mot_cle, input_me)
                    if score > meilleur_score:
                        meilleur_score = score
                        meilleur_match = listes_mots_cles[1]

    # Si le score est au-dessus du seuil, renvoyer la réponse appropriée
    if meilleur_score >= seuil:
        # Si c'est un tuple c'est qu'on est dans le cas des émotions
        if isinstance(meilleur_match, tuple):
            return random.choice(meilleur_match[1])
        return random.choice(meilleur_match)

    return "Je suis désolé, je n'ai pas compris. Pourriez-vous reformuler votre question?"

# Pour calculer la similarité basique entre deux chaînes
def calculer_similarite(mot_cle, input_me):
    mots_user = input_me.split()
    correspondances = sum(1 for mot in mots_user if mot in mot_cle.split())
    return correspondances / max(len(mot_cle.split()), 1)

# Start du chatbot
while True:
    user_input = input("Vous: ")
    reponse = get_rep(user_input)
    print("ChatBot:", reponse)
    if "au revoir" in user_input.lower():
        break