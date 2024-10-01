Add-Type -AssemblyName PresentationFramework

function Start-Game {
    $global:randomNumber = Get-Random -Minimum 1 -Maximum 100
    $global:tries = 0
    $TriesLabel.Content = "Nombre d'essais : $global:tries"
    $GuessInput.Text = ""
    [System.Windows.MessageBox]::Show("Nouvelle partie, devinez un nombre entre 1 et 100 ! 🎮", "Jeu du Plus ou Moins")
}

# Fenêtre
$window = New-Object system.windows.window
$window.Title = "Jeu du Plus ou Moins"
$window.Width = 500
$window.Height = 500
$window.WindowStartupLocation = "CenterScreen"

# Grid
$grid = New-Object System.Windows.Controls.Grid
$grid.Margin = "20"

# Titre
$TriesLabel = New-Object System.Windows.Controls.Label
$TriesLabel.Content = "Nombre d'essais : 0"
$TriesLabel.FontSize = 16
$TriesLabel.HorizontalAlignment = "Left"
$TriesLabel.VerticalAlignment = "Top"
$TriesLabel.Margin = "10,10,0,0"
$grid.Children.Add($TriesLabel)

# Input
$GuessInput = New-Object System.Windows.Controls.TextBox
$GuessInput.FontSize = 16
$GuessInput.Width = 300
$GuessInput.Height = 40
$GuessInput.Margin = "10,10,0,0"
$grid.Children.Add($GuessInput)

# Guess
$GuessButton = New-Object System.Windows.Controls.Button
$GuessButton.Content = "Deviner"
$GuessButton.FontSize = 20
$GuessButton.Width = 150
$GuessButton.Height = 50
$GuessButton.Visibility = "Visible"
$GuessButton.Margin = "0,110,0,0"
$grid.Children.Add($GuessButton)

# Jeu
$GuessButton.Add_Click({
    $userGuess = [int]$GuessInput.Text

    if($userGuess -lt 1 -or $userGuess -gt 100) {
        [System.Windows.MessageBox]::Show("Veuillez entrer un nombre entre 1 et 100 !", "Erreur")
        return
    }

    $global:tries++
    $TriesLabel.Content = "Nombre d'essais : $global:tries"

    if ($userGuess -eq $global:randomNumber) {
        [System.Windows.MessageBox]::Show("Bravo ! Vous avez trouvé le nombre $userGuess en $global:tries essais ! 🎉", "Gagné")
        $GuessButton.Visibility = "Hidden"
        $ReplayButton.Visibility = "Visible"
    } elseif ($userGuess -lt $global:randomNumber) {
        [System.Windows.MessageBox]::Show("C'est plus ! ⬆️", "Indice")
    } else {
        [System.Windows.MessageBox]::Show("C'est moins ! ⬇️", "Indice")
    }
})


# Rejouer
$ReplayButton = New-Object System.Windows.Controls.Button
$ReplayButton.Content = "Rejouer"
$ReplayButton.FontSize = 20
$ReplayButton.Width = 150
$ReplayButton.Height = 50
$ReplayButton.Margin = "0,110,0,0"
$ReplayButton.Visibility = "Hidden"
$grid.Children.Add($ReplayButton)

$ReplayButton.Add_Click({
    $GuessButton.Visibility = "Visible"
    $ReplayButton.Visibility = "Hidden"
    Start-Game
})


$window.Content = $grid
Start-Game
$window.ShowDialog()
