import java.util.HashMap;
import java.util.Map;

public class Traduction {

    private Map<String, Map<String, String>> traductions;

    public String language = "fr";

    public void setLanguage(String language) {
        this.language = language;
    }


    public Traduction() {
        traductions = new HashMap<>();
        initTranslations();
    }

    private void initTranslations() {
        addTranslation("menu.title", "Jeu du Pendu", "Hangman Game", "Juego del Ahorcado");
        addTranslation("menu.customWord", "Jouer avec un mot personnalisé :", "Play with a custom word :", "Jugar con una palabra personalizada :");
        addTranslation("menu.customWord.error", "Veuillez entrer un mot personnalisé", "Please enter a custom word", "Por favor, introduzca una palabra personalizada");
        addTranslation("menu.randomWord", "Jouer avec un mot aléatoire :", "Play with a random word :", "Jugar con una palabra aleatoria :");

        addTranslation("game.guess", "Devinez", "Guess", "Adivinar");
        addTranslation("game.replay", "Rejouer", "Replay", "Repetir");
        addTranslation("game.changeLanguage", "Changer de langue", "Change language", "Cambiar idioma");
        addTranslation("game.enterLetter", "Entrez une lettre :", "Enter a letter :", "Introduce una letra :");
        addTranslation("game.remainingAttempts", "Tentatives restantes : ", "Remaining attempts : ", "Intentos restantes : ");
        addTranslation("game.guessedLetters", "Lettres déjà devinées : ", "Guessed letters : ", "Letras adivinadas : ");
        addTranslation("game.alreadyGuessed", "Vous avez déjà deviné la lettre : ", "You have already guessed the letter : ", "Ya has adivinado la letra : ");
        addTranslation("game.remainingAttempts", "Tentatives restantes : ", "Remaining attempts : ", "Intentos restantes : ");
        addTranslation("game.lost", "Perdu ! Le mot était : ", "Lost ! The word was : ", "Perdido ! La palabra era : ");
        addTranslation("game.won", "Bravo, vous avez trouvé le mot !", "Congratulations, you found the word !", "¡Felicidades, encontraste la palabra !");
        addTranslation("game.invalidLetter", "Veuillez entrer une seule lettre.", "Please enter a single letter.", "Por favor, introduzca una sola letra.");
    }

    private void addTranslation(String key, String fr, String en, String es) {
        Map<String, String> translationMap = new HashMap<>();
        translationMap.put("fr", fr);
        translationMap.put("en", en);
        translationMap.put("es", es);
        traductions.put(key, translationMap);
    }

    public String getTranslation(String key) {
        Map<String, String> translationsForKey = traductions.get(key);
        if (translationsForKey != null) {
            return translationsForKey.getOrDefault(language, key);
        }
        return key;
    }
}
