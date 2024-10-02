import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class Dictionnaire {
    private List<String> mots;

    public Dictionnaire(String filePath) {
        mots = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String ligne;
            while ((ligne = br.readLine()) != null) {
                mots.add(ligne.toLowerCase().trim());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public String getMotAleatoire() {
        Random rand = new Random();
        return mots.get(rand.nextInt(mots.size()));
    }
}
