Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object Windows.Forms.Form
$form.Text = 'Hello World'
$form.AutoSize = $true
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedSingle'

$Label = New-Object -TypeName System.Windows.Forms.Label
$Label.Font = New-Object System.Drawing.Font("Arial", 32, [System.Drawing.FontStyle]::Bold)
$Label.Text = 'Hello World'
$Label.AutoSize = $true
$Label.TextAlign = 'MiddleCenter'
$Label.ForeColor = 'Red'

$form.Controls.Add($Label)

$Label.Left = ($form.ClientSize.Width - $Label.Width) / 2
$Label.Top = ($form.ClientSize.Height - $Label.Height) / 2

$form.ShowDialog()
