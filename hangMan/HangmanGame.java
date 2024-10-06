import javax.swing.*;
import java.awt.*;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.HashSet;
import java.text.Normalizer;
import java.util.regex.Pattern;

public class HangmanGame extends JFrame {
    private JLabel wordLabel;
    private JTextField letterField;
    private JButton guessButton;
    private JButton replayButton;
    private JButton changeLanguageButton;
    private JLabel messageLabel;
    private JLabel attemptsLabel;
    private JLabel guessedLettersLabel;

    private String mot;
    private char[] motAffiche;
    private int tentativesRestantes = 6;
    private HashSet<Character> lettresDejaDonnees;
    private Traduction traduction = new Traduction();

    public HangmanGame(String customWord, String language, boolean isCustom) {
        if (isCustom) {
            this.mot = customWord;
        } else {
            Dictionnaire dict = new Dictionnaire("dicos/" + language + ".txt");
            this.mot = dict.getMotAleatoire();
        }
        // Ici on a init le mot (custom ou aléatoire en fonction de la langue)

        motAffiche = new char[mot.length()];
        for (int i = 0; i < motAffiche.length; i++) {
            motAffiche[i] = '_';
        }

        traduction.setLanguage(language);

        lettresDejaDonnees = new HashSet<>();

        setTitle(traduction.getTranslation("menu.title") + " - " + language);
        setSize(400, 300);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new GridLayout(8, 1));

        wordLabel = new JLabel(getMotAvecEspaces(motAffiche));
        wordLabel.setHorizontalAlignment(JLabel.CENTER);

        letterField = new JTextField(1);

        //On limite l'input à une seule lettre
        letterField.addKeyListener(new KeyAdapter() {
            public void keyTyped(KeyEvent e) {
                if (letterField.getText().length() >= 1 )
                    e.consume();
            }
        });

        guessButton = new JButton(traduction.getTranslation("game.guess"));

        replayButton = new JButton(traduction.getTranslation("game.replay"));
        replayButton.setEnabled(false);

        changeLanguageButton = new JButton(traduction.getTranslation("game.changeLanguage"));

        messageLabel = new JLabel(traduction.getTranslation("game.enterLetter"));
        messageLabel.setHorizontalAlignment(JLabel.CENTER);

        attemptsLabel = new JLabel(traduction.getTranslation("game.remainingAttempts") + tentativesRestantes);
        attemptsLabel.setHorizontalAlignment(JLabel.CENTER);

        guessedLettersLabel = new JLabel(traduction.getTranslation("game.guessedLetters"));
        guessedLettersLabel.setHorizontalAlignment(JLabel.CENTER);

        add(attemptsLabel);
        add(wordLabel);
        add(messageLabel);
        add(letterField);
        add(guessButton);
        add(guessedLettersLabel);
        add(replayButton);

        // on ajout replay que si c'est un mot custom
        if (!isCustom) {
            add(changeLanguageButton);
        }

        guessButton.addActionListener(e -> devinerLettre());

        // Si c'est un mot custom, on revient au menu principal pour choisir une autre langue
        replayButton.addActionListener(e -> {
            if (isCustom) {
                changerLangue();
            } else {
                rejouer(language);
            }
        });

        changeLanguageButton.addActionListener(e -> {
            changerLangue();
        });
    }

    private void devinerLettre() {
        String input = letterField.getText().toLowerCase();
        if (input.length() == 1) {
            char lettre = input.charAt(0);

            lettre = normaliserLettre(lettre);

            if (lettresDejaDonnees.contains(lettre)) {
                messageLabel.setForeground(Color.BLUE);
                messageLabel.setText(traduction.getTranslation("game.alreadyGuessed") + lettre);
                letterField.setText("");
                return;
            }

            lettresDejaDonnees.add(lettre);
            boolean lettreTrouvee = false;

            // On parcourt le mot pour voir si la lettre est dedans
            for (int i = 0; i < mot.length(); i++) {
                if (normaliserLettre(mot.charAt(i)) == lettre) {
                    motAffiche[i] = mot.charAt(i);
                    lettreTrouvee = true;
                }
            }

            if (!lettreTrouvee) {
                tentativesRestantes--;
                attemptsLabel.setText(traduction.getTranslation("game.remainingAttempts") + tentativesRestantes);
            }

            wordLabel.setText(getMotAvecEspaces(motAffiche));
            letterField.setText("");

            guessedLettersLabel.setText(traduction.getTranslation("game.guessedLetters") + lettresDejaDonnees.toString());

            if (tentativesRestantes <= 0) {
                messageLabel.setForeground(Color.RED);
                messageLabel.setText(traduction.getTranslation("game.lost") + mot);
                guessButton.setEnabled(false);
                replayButton.setEnabled(true);
            } else if (new String(motAffiche).equals(mot)) {
                messageLabel.setForeground(Color.GREEN);
                messageLabel.setText(traduction.getTranslation("game.won"));
                guessButton.setEnabled(false);
                replayButton.setEnabled(true);
            }
        } else {
            messageLabel.setText(traduction.getTranslation("game.invalidLetter"));
            messageLabel.setForeground(Color.RED);
        }
    }

    private char normaliserLettre(char lettre) {
        String lettreStr = String.valueOf(lettre);
        String normalisee = Normalizer.normalize(lettreStr, Normalizer.Form.NFD);
        return Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(normalisee).replaceAll("").charAt(0);
    }


    private void rejouer(String language) {
        tentativesRestantes = 6;
        Dictionnaire dict = new Dictionnaire("dicos/" + language + ".txt");
        String motAleatoire = dict.getMotAleatoire();
        this.mot = motAleatoire;

        motAffiche = new char[mot.length()];
        for (int i = 0; i < motAffiche.length; i++) {
            motAffiche[i] = '_';
        }

        lettresDejaDonnees.clear();

        attemptsLabel.setText(traduction.getTranslation("game.remainingAttempts") + tentativesRestantes);
        wordLabel.setText(new String(motAffiche));
        letterField.setText("");
        guessButton.setEnabled(true);
        replayButton.setEnabled(false);
        messageLabel.setText(traduction.getTranslation("game.enterLetter"));
        guessedLettersLabel.setText(traduction.getTranslation("game.guessedLetters"));
    }

    private void changerLangue() {
        MainMenu menu = new MainMenu();
        menu.setVisible(true);
        this.dispose();
    }

    private String getMotAvecEspaces(char[] motAffiche) {
        StringBuilder motAvecEspaces = new StringBuilder();
        for (char c : motAffiche) {
            motAvecEspaces.append(c).append(" ");
        }
        return motAvecEspaces.toString().trim();
    }
}
