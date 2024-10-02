Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName Microsoft.VisualBasic

$global:isCancelled = $false
# Fenêtre
$window = New-Object system.windows.window
$window.Title = "Jeu du Plus ou Moins"
$window.Width = 500
$window.Height = 500
$window.WindowStartupLocation = "CenterScreen"

function Start-Game
{
    [System.Windows.MessageBox]::Show("Bienvenue dans le jeu du Plus ou Moins ! 🎮", "Jeu du Plus ou Moins")

    while ($true)
    {
        $global:minNumber = [Microsoft.VisualBasic.Interaction]::InputBox("Entrez la valeur minimale", "Jeu du Plus ou Moins", "1")

        if ( [string]::IsNullOrEmpty($global:minNumber))
        {
            [System.Windows.MessageBox]::Show("Le jeu a été annulé.", "Annulation")
            $global:isCancelled = $true
            $window.Close()
            return
        }


        if (-not [int]::TryParse($global:minNumber, [ref]$null))
        {
            [System.Windows.MessageBox]::Show("Veuillez entrer un nombre valide pour la valeur minimale !", "Erreur")
            continue
        }
        break
    }

    while ($true)
    {
        $global:maxNumber = [Microsoft.VisualBasic.Interaction]::InputBox("Entrez la valeur maximale", "Jeu du Plus ou Moins", "100")

        if ( [string]::IsNullOrEmpty($global:maxNumber))
        {
            [System.Windows.MessageBox]::Show("Le jeu a été annulé.", "Annulation")
            $global:isCancelled = $true
            $window.Close()
            return
        }

        if (-not [int]::TryParse($global:maxNumber, [ref]$null))
        {
            [System.Windows.MessageBox]::Show("Veuillez entrer un nombre valide pour la valeur maximale !", "Erreur")
            continue
        }

        if ([int]$global:minNumber -ge [int]$global:maxNumber)
        {
            [System.Windows.MessageBox]::Show("La valeur minimale doit être inférieure à la valeur maximale !", "Erreur")
            continue
        }

        break
    }

    $global:randomNumber = Get-Random -Minimum $global:minNumber -Maximum $global:maxNumber
}

Start-Game
if ($global:isCancelled)
{
    return
}

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
    try {
        $userGuess = [int]$GuessInput.Text
    } catch {
        [System.Windows.MessageBox]::Show("Veuillez entrer un nombre valide !", "Erreur")
        return
    }


    if ($userGuess -lt $global:minNumber -or $userGuess -gt $global:maxNumber)
    {
        [System.Windows.MessageBox]::Show("Veuillez entrer un nombre entre $global:minNumber et $global:maxNumber !", "Erreur")
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


$LabelCredit = New-Object System.Windows.Controls.TextBlock
$LabelCredit.Text = "Créé par @Fredray-21"
$LabelCredit.FontSize = 16
$LabelCredit.HorizontalAlignment = "Center"
$LabelCredit.VerticalAlignment = "Bottom"
$LabelCredit.Margin = "0,0,0,0"
$LabelCredit.Cursor = "Hand"
$LabelCredit.Foreground = "Blue"
$LabelCredit.ToolTip = "Cliquez pour accéder à mon GitHub"

$LabelCredit.Add_MouseLeftButtonDown({
    Start-Process "https://github.com/Fredray-21"
})

$LabelCredit.Add_MouseEnter({
    $LabelCredit.TextDecorations = [System.Windows.TextDecorations]::Underline
})

$LabelCredit.Add_MouseLeave({
    $LabelCredit.TextDecorations = [System.Windows.TextDecorations]::None
})

$LabelCredit.Add_MouseRightButtonDown({
    [System.Windows.MessageBox]::Show("Coucouuu !", "Info")
})

$grid.Children.Add($LabelCredit)


$window.Content = $grid
$window.ShowDialog() | Out-Null
