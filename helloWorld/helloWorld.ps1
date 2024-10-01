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

$LabelCredit = New-Object -TypeName System.Windows.Forms.LinkLabel
$LabelCredit.Font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Regular)
$LabelCredit.Text = 'Par : @Fredray-21'
$LabelCredit.AutoSize = $true
$LabelCredit.TextAlign = 'MiddleCenter'
$LabelCredit.ForeColor = 'Black'
$LabelCredit.Links.Add(6, 12, 'https://github.com/Fredray-21')
$LabelCredit.add_LinkClicked({
    Start-Process $_.Link.LinkData
})

$form.Controls.Add($LabelCredit)
$form.Controls.Add($Label)

$Label.Left = ($form.ClientSize.Width - $Label.Width) / 2
$Label.Top = ($form.ClientSize.Height - $Label.Height) / 2

$LabelCredit.Left = ($form.ClientSize.Width - $LabelCredit.Width) / 2
$LabelCredit.Top = $Label.Top + $Label.Height + 10

$form.ShowDialog()
