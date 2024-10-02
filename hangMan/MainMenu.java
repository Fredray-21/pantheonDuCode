import javax.swing.*;
import java.awt.*;

public class MainMenu extends JFrame {
    private JTextField customWordField;
    private Traduction traduction = new Traduction();

    public MainMenu() {
        setTitle(traduction.getTranslation("menu.title"));
        setSize(400, 300);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new GridLayout(7, 1));

        JPanel customWordPanel = new JPanel(new FlowLayout());
        JLabel customWordLabel = new JLabel(traduction.getTranslation("menu.customWord"));
        customWordField = new JTextField(10);
        customWordPanel.add(customWordLabel);
        customWordPanel.add(customWordField);
        add(customWordPanel);

        JButton startButton = new JButton("Start");
        startButton.addActionListener(e -> {
            if(customWordField.getText().trim().isEmpty()) {
                JOptionPane.showMessageDialog(this, traduction.getTranslation("menu.customWord.error"), "Erreur", JOptionPane.ERROR_MESSAGE);
                return;
            }
            startGame("fr");
        });
        add(startButton);

        JPanel emptyPanel = new JPanel();
        add(emptyPanel);

        JLabel randomWordLabel = new JLabel(traduction.getTranslation("menu.randomWord"), JLabel.CENTER);
        add(randomWordLabel);

        JButton frenchButton = new JButton("Français");
        frenchButton.addActionListener(e -> startGame("fr"));
        add(frenchButton);

        JButton englishButton = new JButton("English");
        englishButton.addActionListener(e -> startGame("en"));
        add(englishButton);

        JButton spanishButton = new JButton("Español");
        spanishButton.addActionListener(e -> startGame("es"));
        add(spanishButton);
    }


    private void startGame(String language) {
        String customWord = customWordField.getText().trim();

        HangmanGame game;
        if (!customWord.isEmpty()) {
            game = new HangmanGame(customWord, language, true);
        } else {
            game = new HangmanGame(new String(), language, false);
        }

        game.setVisible(true);
        this.dispose();
    }

    public static void main(String[] args) {
        MainMenu menu = new MainMenu();
        menu.setVisible(true);
    }
}
