.MODEL SMALL     ; On utilise le small (donc juste les segments DATA et CODE)
.STACK 500H      ; Allouage de la memoire 500H (16) = 1280 (10) = (1280octets)

.DATA            ; segment DATA

; ----------------- LES CONSTANTES ET VARIABLES -----------------
; '$' c'est pour definir une la fin de chaine

; LES ICONS X et O
PIECE_1 DB ' (X)$'          ; $ pour la fin de chaine
PIECE_2 DB ' (O)$'          ; $ pour la fin de chaine

; VARIABLES POUR LE JEU
PLAYER DB 50, '$'           ; ici le numero du player 50 ASCII = 2 (2 par DEFAULT)
MOVES DB 0                  ; ici le nombre de mouvement effectuer
IS_DONE DB 0                ; ici bool (0 ou 1) savoir si la partie est terminee
IS_DRAW DB 0                ; ici bool (0 ou 1) savoir si match null
IS_VS_IA DB 0               ;ici bool (0 ou 1) savoir si le player 2 c'est local ou IA

; --------NUMERO DES CELLULES--------
C1 DB '1$'
C2 DB '2$'
C3 DB '3$'
C4 DB '4$'
C5 DB '5$'
C6 DB '6$'
C7 DB '7$'
C8 DB '8$'
C9 DB '9$'

; -------LES LIGNE DU BOARD--------
L1 DB '   |   |   $'
L2 DB '---+---+---$'
N1 DB ' | $'

; CURRENT ICON (X/O)
CURRENT_ICON DB 88          ; 88 ASCII = X (X par DEFAULT)

; LES TEXTES D'AFFICHAGE
ANY_KEY DB "Appuyez sur n'importe quelle touche pour continuer...$"
INPUT DB ':: Entrez le numero de cellule. : $'
TKN DB "Cette cellule est prise ! Appuyez sur n'importe quelle touche...$"

; Message de win coupe en 2 car on
WIN_MSG_S DB 'Joueur $'
WIN_MSG_E DB ' a gagne le jeu!$'
DRW DB 'Le jeu est une egalite!$'

; TRY AGAIN PROMPT MESSAGES -----------------------------
RETRY_MSG DB 'Voulez-vous rejouer ? (y/n): $'
WRONG_INPUT_MSG DB "Mauvaise saisie! Appuyez sur n'importe quelle touche... $"

; THIS LINE IS USED TO OVERWIRTE A LINE TO CLEAN THE AREA
EMP DB '                                                           $'

; MENU TEXT
MENU DB '1. Jouer en local$'
MENU2 DB '2. Jouer vs IA$'
MENU3 DB 'Choisissez une option: $'

;--------------------------------------------------------

.CODE
MAIN PROC              ; procedure MAIN
    MOV AX, @DATA      ; dans AX on met l'adress des DATAS dans AX
    MOV DS, AX         ; on init DS avec les data de AX (DS -> segment de donnees)

    ; Afficher le menu
    CALL SHOW_MENU

    ; Lire le choix de l'utilisateur
    MOV AH, 1          ; Un input avec le choix de l'user
    INT 21H

    ; Verifier le choix de l'utilisateur
    CMP AL, '1'         ; Comparer avec '1'
    JE LOCAL_GAME       ; on init le game en jeu local
    CMP AL, '2'         ; Comparer avec '2'
    JE AI_GAME          ; on init le game vs IA    
    
    

    
    ; Si l'entree est incorrecte, afficher le message d'erreur
    
    MOV AH, 2           ; Meme logique que pour le mouvement du cursor
    MOV DH, 17
    MOV DL, 20
    INT 10H
    
    LEA DX, WRONG_INPUT_MSG         ; Charger l'adresse du message d'erreur
    MOV AH, 9                       ; Fonction 9 pour afficher une chaine de charactere
    INT 21H                         ; call de l'interuption pour afficher le message
    
    MOV AH, 7                       ; Parreil, on demande un input au player MAIS sans ECHO (pour le press any keys) il ne va pas afficher la value
    INT 21H                         ; interuption
    
    JMP MAIN                        ; Revenir au debut pour redemander le choix

; on joue en local
LOCAL_GAME:
    MOV IS_VS_IA, 0                ; On met la valeur 0 dans IS_VS_IA
    CALL INIT                      ; on call la fonction INIT (qui init les variable)
    JMP PLRCHANGE

; on joue vs ia
AI_GAME:
    MOV IS_VS_IA, 1
    CALL INIT
    JMP PLAYER_INPUT

; ---------- INITIALIZE ---------------------
INIT:
    MOV PLAYER, 50     ; On init toutes les variables (pour le replay)
    MOV MOVES, 0       ; On move toute les valeurs dans les variables respectivent
    MOV IS_DONE, 0
    MOV IS_DRAW, 0

    MOV C1, 49
    MOV C2, 50
    MOV C3, 51
    MOV C4, 52
    MOV C5, 53
    MOV C6, 54
    MOV C7, 55
    MOV C8, 56
    MOV C9, 57

    JMP PLRCHANGE      ; PLRCHANGE on jump vers le player change

; ------------ VICTORY ------------------------
VICTORY:
    LEA DX, WIN_MSG_S                   ; On met l'adresse du msg WIN_MSG_S dans DX
    MOV AH, 9                           ; On met la fonction 9 dans AH (la fonction 9 dans AH pour l'interuption 21H -> elle correspond a "afficher une chaine de caratere"
    INT 21H                             ; interuption

    LEA DX, PLAYER                      ; On met l'adresse du PLAYER dans DX
    MOV AH, 9                           ; parreil fonction 9 dans AH pour 21H
    INT 21H                             ; interuption

    LEA DX, WIN_MSG_E                   ; On met l'adresse du msg WIN_MSG_E dans DX
    MOV AH, 9                           ; parreil fonction 9 dans AH pour 21H
    INT 21H                             ; interuption

    
    ; DEFINIR LA POSITION DU CURSEUR
    MOV AH, 2                           ; la valeur 2 dans le registe AH avec l'interuption 10H c'est la fonction pour move un cursor
    MOV DH, 17                          ; DH registe de la position vertical du curseur (6 = 7eme ligne)
    MOV DL, 20                          ; DL registe de la position horizontal du curseur (30 = 31eme colone)
    INT 10H                             ; appel de l'interuption 10H pour call la fonction de AH


    LEA DX, ANY_KEY                     ; On met l'adresse du msg ANY_KEY dans DX
    MOV AH, 9                           ; parreil fonction 9 dans AH pour 21H
    INT 21H                             ; interuption

    MOV AH, 7                           ; On demande un input au player MAIS sans ECHO (pour le press any keys) il ne va pas afficher la value
    INT 21H                             ; interuption

    JMP TRYAGAIN                        ; On jump a TRYAGAIN
    
    
    
; ------------ DRAW ------------
DRAW:
    LEA DX, DRW                         ; On met l'adresse du msg DRW dans DX
    MOV AH, 9                           ; parreil fonction 9 dans AH pour 21H
    INT 21H                             ; interuption

    MOV AH, 2                           ; Meme logique que pour le mouvement du cursor
    MOV DH, 17
    MOV DL, 20
    INT 10H

    LEA DX, ANY_KEY                     ; Parreil on met l'adresse du msg ANY_KEY dans DX 
    MOV AH, 9                           ; parreil fonction 9 dans AH pour 21H
    INT 21H

    MOV AH, 7                           ; Parreil, on demande un input au player MAIS sans ECHO (pour le press any keys) il ne va pas afficher la value
    INT 21H                             ; interuption

    JMP TRYAGAIN                        ; On jump a TRYAGAIN
         
         
         
; ------------ LES CONDITION DE VICTOIRE -----------
CHECK:
    CHECK1:  ; CHECKING 1, 2, 3
        MOV AL, C1             ; On met la valeur de C1 dans AL
        MOV BL, C2             ; On met la valeur de C1 dans BL
        MOV CL, C3             ; On met la valeur de C1 dans CL

        CMP AL, BL             ; On fait un if si c'est pas parreil on va fait le CHECK suivant 
        JNZ CHECK2             ; JNZ (saut conditionel) -> si le flag Z est a 1 alors on va a VICTORY sinon on continue

        CMP BL, CL             ; On fait un if si c'est pas parreil on va fait le CHECK suivant
        JNZ CHECK2

        MOV IS_DONE, 1         ; si on est ici c'est que les 3 cell sont egal donc quelqu'un a gagner
        JMP BOARD              ; on jump au BOARD

    CHECK2:  ; CHECKING 4, 5, 6
        MOV AL, C4             ; PARREIL POUR LES 8 AUTRE CHECK (vertical/horizontal/diagonal)
        MOV BL, C5
        MOV CL, C6

        CMP AL, BL
        JNZ CHECK3

        CMP BL, CL
        JNZ CHECK3

        MOV IS_DONE, 1
        JMP BOARD

    CHECK3:  ; CHECKING 7, 8, 9
        MOV AL, C7
        MOV BL, C8
        MOV CL, C9

        CMP AL, BL
        JNZ CHECK4

        CMP BL, CL
        JNZ CHECK4

        MOV IS_DONE, 1
        JMP BOARD

    CHECK4:   ; CHECKING 1, 4, 7
        MOV AL, C1
        MOV BL, C4
        MOV CL, C7

        CMP AL, BL
        JNZ CHECK5

        CMP BL, CL
        JNZ CHECK5

        MOV IS_DONE, 1
        JMP BOARD

    CHECK5:   ; CHECKING 2, 5, 8
        MOV AL, C2
        MOV BL, C5
        MOV CL, C8

        CMP AL, BL
        JNZ CHECK6

        CMP BL, CL
        JNZ CHECK6

        MOV IS_DONE, 1
        JMP BOARD

    CHECK6:   ; CHECKING 3, 6, 9
        MOV AL, C3
        MOV BL, C6
        MOV CL, C9

        CMP AL, BL
        JNZ CHECK7

        CMP BL, CL
        JNZ CHECK7

        MOV IS_DONE, 1
        JMP BOARD

    CHECK7:   ; CHECKING 1, 5, 9
        MOV AL, C1
        MOV BL, C5
        MOV CL, C9

        CMP AL, BL
        JNZ CHECK8

        CMP BL, CL
        JNZ CHECK8

        MOV IS_DONE, 1              
        JMP BOARD

    CHECK8:   ; CHECKING 3, 5, 7
        MOV AL, C3
        MOV BL, C5
        MOV CL, C7

        CMP AL, BL
        JNZ DRAWCHECK             ; ici on va regarder si on est en mathc null (car y'a pas d'autre check a faire)

        CMP BL, CL
        JNZ DRAWCHECK             ; ici on va regarder si on est en mathc null (car y'a pas d'autre check a faire)

        MOV IS_DONE, 1
        JMP BOARD

    DRAWCHECK:
        MOV AL, MOVES             ; on met la valeurs de MOVES dans AL
        CMP AL, 9                 ; on compare la valeur de AL et 9 si c'est pas egal on change de player
        JB PLRCHANGE

        MOV IS_DRAW, 1            ; si on est ici c'est que la parti est fini -> on set DRAW a 1
        JMP BOARD                 

        JMP EXIT
                        
                        
                        
; ------------ PLAYER ----------
PLRCHANGE:
    CMP PLAYER, 49              ; on compare la valeur du PLAYER avec 49 (si c'est true alors le flag Z passe a 1)
    JZ P2                       ; si flag === 0 alors on va a P2
    CMP PLAYER, 50              ; parreil avec 50
    JZ P1

    P1:
        MOV PLAYER, 49          ; On est player 2(50) on met le prochain player 1(49) dans PLAYER  (donc PLAYER = 1)
        MOV CURRENT_ICON, 88    ; on met le current icon dans CURRENT_ICON
        JMP BOARD               ; on jump vers le BOARD

    P2:
        MOV PLAYER, 50          ; On est player 1(49) on met le prochain player 2(50) dans PLAYER  (donc PLAYER = 2)
        MOV CURRENT_ICON, 79    ; on met le current icon dans CURRENT_ICON
        CMP IS_VS_IA, 1         ; SI ON EST VS L'IA ->
        JZ IA_MOVE              ; IA doit faire donc mouvement 
        JMP BOARD               ; on jump vers le BOARD
; -------FIN PLAYER ----------
                          
                          
                          
; ------------- BOARD ----------
BOARD:
    ; EFFACER L'ECRAN
    MOV AX,0600H                       ; AX contient une fonction et ses param -> 06 dans AH = defilement ET 00H c'est le nombre de ligne a defiller (00H = defilement complet donc CLEAN de la fenetre) 
    MOV BH,07H                         ; BH c'est la couleur -> fond noir (0) et texte blanc (7)
    MOV CX,0000H                       ; CX registre pour le coin superieur gauche a effacer (ici 0,0) donc 00 00
    MOV DX,184FH                       ; DX registe pour le con inferieur droite donc 18 et 4F -> 24,79  (donc couvre donc tout lecran en mode 80x25)      !!!!!!!!!!!!!!!!!(il ne faut pas redimentioner la fenetre sinon ca nique tout le cursor)
    INT 10H                            ; execution de l'interuption

    ; DEFINIR LA POSITION DU CURSEUR
    MOV AH, 2                          ; la valeur 2 dans le registe AH avec l'interuption 10H c'est la fonction pour move un cursor
    MOV BH, 0                          ; BH c'est le registe du render actif (0 page actif)
    MOV DH, 7                          ; DH registe de la position vertical du curseur (6 = 7eme ligne)
    MOV DL, 30                         ; DL registe de la position horizontal du curseur (30 = 31eme colone)
    INT 10H                            ; appel de l'interuption 10H pour call la fonction de AH



    ; AFFICHER UN ESPACE
    MOV AH, 2                          ; valeur 2 dans le registe AH avec l'interuption 21H c'est la fonction affichage d'un char
    MOV DL, 32                         ; 32 en ASCII = ' ' -> on place un espace vide dans le registre DL(DL fait 8 bits) 
    INT 21H                            ; on execute l'interuption

    ; AFFICHER LA CELLULE 1
    LEA DX, C1                         ; (LEA) on charge l'adresse de C1 dans le registre DX (DX pour donnee large/adresse 16 bits (dans DX il y a DL))
    MOV AH, 9                          ; on met 9 dans AH pour l'interuption 21h -> (fonction affichage chaine de char)
    INT 21H                            ; appel de l'interuption 

    ; AFFICHER UN SEPARATEUR
    LEA DX, N1                         ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER LA CELLULE 2
    LEA DX, C2                         ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER UN SEPARATEUR
    LEA DX, N1                         ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER LA CELLULE 3
    LEA DX, C3                         ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; DEFINIR LA POSITION DU CURSEUR
    MOV AH, 2                          ; Meme logique que pour le mouvement du cursor
    MOV DH, 8
    MOV DL, 30
    INT 10H

    ; AFFICHER UNE LIGNE HORIZONTALE DU TABLEAU
    LEA DX, L2                         ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; DEFINIR LA POSITION DU CURSEUR
    MOV AH, 2                           ; Meme logique que pour le mouvement du cursor
    MOV DH, 9
    MOV DL, 30
    INT 10H

    ; AFFICHER UN ESPACE
    MOV AH, 2                           ; meme logique que pour AFFICHER UN ESPACE
    MOV DL, 32
    INT 21H

    ; AFFICHER LA CELLULE 4
    LEA DX, C4                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER UN SEPARATEUR
    LEA DX, N1                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER LA CELLULE 5
    LEA DX, C5                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER UN SEPARATEUR
    LEA DX, N1                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER LA CELLULE 6
    LEA DX, C6                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; DEFINIR LA POSITION DU CURSEUR
    MOV AH, 2                           ; Meme logique que pour le mouvement du cursor
    MOV DH, 10
    MOV DL, 30
    INT 10H

    ; AFFICHER UNE LIGNE HORIZONTALE DU TABLEAU
    LEA DX, L2                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; DEFINIR LA POSITION DU CURSEUR
    MOV AH, 2                           ; Meme logique que pour le mouvement du cursor
    MOV DH, 11
    MOV DL, 30
    INT 10H

    ; AFFICHER UN ESPACE
    MOV AH, 2                           ; meme logique que pour AFFICHER UN ESPACE
    MOV DL, 32
    INT 21H

    ; AFFICHER LA CELLULE 7
    LEA DX, C7                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER UN SEPARATEUR
    LEA DX, N1                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER LA CELLULE 8
    LEA DX, C8                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER UN SEPARATEUR
    LEA DX, N1                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; AFFICHER LA CELLULE 9
    LEA DX, C9                          ; Meme logique que CELLULE 1
    MOV AH, 9
    INT 21H

    ; DEFINIR LA POSITION DU CURSEUR
    MOV AH, 2                           ; Meme logique que pour le mouvement du cursor
    MOV DH, 16
    MOV DL, 20
    INT 10H

    ; VERIFIER SI LE JEU EST TERMINE
    CMP IS_DONE, 1                         ; CMP (compare) compare 2 valeur -> ici la valeur de IS_DONE est === a 1  (ca edit un flag Z qui stock le resultat du IF (si c'est true alors Z = 1)
    JZ VICTORY                            ; JNZ (saut conditionel) -> si le flag Z est  encore a 0 alors on va a VICTORY sinon on continue

    ; VERIFIER SI LE JEU EST NUL
    CMP IS_DRAW, 1                         ; Meme logique que au dessus
    JZ DRAW

; ------------ FIN DU TABLEAU -------



; ------------ INPUT --------------
PLAYER_INPUT:
    LEA DX, WIN_MSG_S                       ; on met l'adress du msg WIN_MSG_S dans DX
    MOV AH, 9                               ; on met la fonction 9 dans AH (affichage chaine de char) pour interuption 21H
    INT 21H                                 ; interuption

    MOV AH, 2                               ; on met 2 dans AH (fonction pour lire input clavier) pour interuption 21H
    MOV DL, PLAYER                          ; on met la valeur de PLAYER dans DL
    INT 21H                                 ; interuption

    CMP PLAYER, 49                          ; si PLAYER c'est 49(player 1) alors le flag Z sera === 1
    JZ PL1                                  ; si flag Z === 0 alors on PL1

    LEA DX, PIECE_2                         ; on met l'adresse de la chaine PIECE_2 dans registre DX  
    MOV AH, 9                               ; on met 9 dans AH (fonction pour afficher chaine de caractere encore) pour l'interuption 21H
    INT 21H                                 ; interuption
    JMP TAKEINPUT                           ; JUMP vers le TAKEINPUT

    PL1:
        LEA DX, PIECE_1                     ; SI ON EST ICI on est player 1 donc on fait parreil que au dessus mais avec PIECE_1
        MOV AH, 9
        INT 21H

    TAKEINPUT:
    LEA DX, INPUT                           ; on met l'adress du msg INPUT dans DX
    MOV AH, 9                               ; on met 9 dans AH (fonction pour afficher chaine de caractere encore) pour l'interuption 21H
    INT 21H                                 ; interuption

    MOV AH, 1                               ; fonction 1 dans registre AH lecture calvier pour interuption 21H
    INT 21H                                 ; interuption

    INC MOVES                               ; on increment MOVES de 1

    MOV BL, AL                              ; on met la valeurs de AL dans BL
    SUB BL, 48                              ; on soustrait 48 a la valeur dans BL  (on converti un number en ASCII)
                                            
    MOV CL, CURRENT_ICON                    ; on met dans CL la valeur de  CURRENT_ICON

                                            ; On regarde si l'input est entre 1 et 9
    CMP BL, 1                               ; dans BL on a l'input du clavier converti en  ASCII -> donc parreil on fait un if 
    JZ  C1U                                 ; si c'est la meme c'est que le player a ecrit cette cell et donc in va faire la modification de la cell

    CMP BL, 2                               ; parreil pour les 9 cellules
    JZ  C2U

    CMP BL, 3
    JZ  C3U

    CMP BL, 4
    JZ  C4U

    CMP BL, 5
    JZ  C5U

    CMP BL, 6
    JZ  C6U

    CMP BL, 7
    JZ  C7U

    CMP BL, 8
    JZ  C8U

    CMP BL, 9
    JZ  C9U

    ; Si on est ici c'est que l'input est invalide (ce n'est pas un chiffre entre 1 et 9)
    DEC MOVES                               ; On decrement MOVES car c'est un moves invalide

    
    MOV AH, 2                               ; on set le curseur pour ecrire le msg d'erreur
    MOV DH, 16                              ; Meme logique que pour le mouvement du cursor
    MOV DL, 20
    INT 10H

    LEA DX, WRONG_INPUT_MSG                 ; on met dans DX l'adresse du WRONG_INPUT_MSG
    MOV AH, 9                               ; fonction 9 dans AH (affichage chaine de char)
    INT 21H                                 ; interuption

    MOV AH, 7                               ; On fait une demande clavier mais dans ECHO (sans voir ce que le player choisi) c'est pour le press any keys
    INT 21H                                 ; interuption

    MOV AH, 2                               ; on set le curseur pour ecrire le msg d'erreur
    MOV DH, 16                              ; Meme logique que pour le mouvement du cursor
    MOV DL, 20
    INT 10H

    LEA DX, EMP                             ; on met dans DX l'adresse du EMP (une row vide avec que des spaces)
    MOV AH, 9
    INT 21H


    MOV AH, 2                               ; on set le curseur pour ecrire le msg d'erreur
    MOV DH, 16                              ; Meme logique que pour le mouvement du cursor
    MOV DL, 20
    INT 10H
                                            ; on jump a PLAYER_INPUT (pour re demander une cell)
    JMP PLAYER_INPUT

    TAKEN:
        DEC MOVES                           ; Si on est ici c'est que la cell est deja prise -> parreil on decrement car move invalide

        MOV AH, 2                           ; on set le curseur pour ecrire le msg d'erreur
        MOV DH, 16                          ; Meme logique que pour le mouvement du cursor
        MOV DL, 20
        INT 10H

        LEA DX, TKN                         ; on met dans DX l'adresse du TKN (msg qui dit que la cell es deja prise)
        MOV AH, 9                           ; interuption
        INT 21H

        MOV AH, 7                           ; Parreil c'est un input sans ECHO pour le "press any keys"
        INT 21H

                       
        MOV AH, 2                           ; on set le curseur pour ecrire le msg d'erreur
        MOV DH, 16
        MOV DL, 20
        INT 10H

        LEA DX, EMP                         ; Parreil on met dans DX l'adresse du EMP (une row vide avec que des spaces)
        MOV AH, 9
        INT 21H


        MOV AH, 2                           ; on set le curseur pour ecrire le msg d'erreur
        MOV DH, 16                          ; Meme logique que pour le mouvement du cursor
        MOV DL, 20
        INT 10H

        JMP PLAYER_INPUT                    ; on jump a PLAYER_INPUT pour re demander le choix d'une cell 

    
    ; ON UPDATE LES CELLULES  (on fait des check avant pour verifier qui elle ne sont pas deja prise)
    C1U:
        CMP C1, 88  ; toujours parreil, on regarde si on a un 'X'
        JZ TAKEN    ; Si c'est === ça veux dire que la CELL est DEJA prise donc on go msg d'erreur -> on va re demander un input
        CMP C1, 79  ; toujours parreil, on regarde si on a un 'O'
        JZ TAKEN    ; same

        MOV C1, CL  ; Si la cellules etait vide on arrive ICI -> on move la valeur de CL (le CURRENT_ICON) dans C1
        JMP CHECK   ; on va faire un check pour verifier la fin de la parti

    C2U:
        CMP C2, 88  ; Parreil pour les 9 cellules
        JZ TAKEN
        CMP C2, 79  
        JZ TAKEN

        MOV C2, CL
        JMP CHECK

    C3U:
        CMP C3, 88  
        JZ TAKEN
        CMP C3, 79  
        JZ TAKEN

        MOV C3, CL
        JMP CHECK

    C4U:
        CMP C4, 88 
        JZ TAKEN
        CMP C4, 79 
        JZ TAKEN

        MOV C4, CL
        JMP CHECK

    C5U:
        CMP C5, 88  
        JZ TAKEN
        CMP C5, 79 
        JZ TAKEN

        MOV C5, CL
        JMP CHECK

    C6U:
        CMP C6, 88  
        JZ TAKEN
        CMP C6, 79
        JZ TAKEN

        MOV C6, CL
        JMP CHECK

    C7U:
        CMP C7, 88  
        JZ TAKEN
        CMP C7, 79  
        JZ TAKEN

        MOV C7, CL
        JMP CHECK

    C8U:
        CMP C8, 88   
        JZ TAKEN
        CMP C8, 79   
        JZ TAKEN

        MOV C8, CL
        JMP CHECK

    C9U:
        CMP C9, 88  
        JZ TAKEN
        CMP C9, 79  
        JZ TAKEN

        MOV C9, CL
        JMP CHECK
; ------------ FIN DU INPUT --------------                   
                   
                   
; ----------- TRY AGAIN -----------
TRYAGAIN:
                            ; On clear l'ecran
    MOV AX,0600H            ; Meme logique que le EFFACER L'ECRAN pour clear le screen
    MOV BH,07H
    MOV CX,0000H
    MOV DX,184FH
    INT 10H

                            ; On set le cursor pour pouvoir ecrire le message d'erreur
    MOV AH, 2               ; Meme logique que pour le mouvement du cursor
    MOV BH, 0
    MOV DH, 10
    MOV DL, 24
    INT 10H

    LEA DX, RETRY_MSG       ; On met l'adress du message RETRY_MSG dans DX
    MOV AH, 9               ; on met la fonction 9 dans AH (affichage chaine de char) pour interuption 21H
    INT 21H                 ; interuption

    MOV AH, 1               ; fonction 1 dans registre AH pour interuption 21h (lecture d'un char depuis le clavier)
    INT 21H                 ; interuption

    CMP AL, 121             ; On regarde si la valeur dans AL (input) est 121 ('y')
    JMP MAIN

    CMP AL, 89              ; On regarde si la valeur dans AL (input) est 89 ('Y')
    JMP MAIN
    
    CMP AL, 79              ; On regarde si la valeur dans AL (input) est 79 ('o')
    JMP MAIN
    
    CMP AL, 111             ; On regarde si la valeur dans AL (input) est 111 ('O')
    JMP MAIN
    
    

    CMP AL, 110             ; On regarde si la valeur dans AL (input) est 111 ('n')
    JZ EXIT
    CMP AL, 78              ; On regarde si la valeur dans AL (input) est 111 ('N')
    JZ EXIT


                             ;Si on est la c'est que input invalide donc on set le cursor pour ecrire msg d'erreur
    MOV AH, 2                ; Meme logique que pour le mouvement du cursor
    MOV BH, 0
    MOV DH, 10
    MOV DL, 24
    INT 10H

    LEA DX, WRONG_INPUT_MSG  ; On met l'adresse du msg d'error dans DX
    MOV AH, 9                ; Parreil 9 dans AH pour interuption 21H = fonction qui ecrit chaine de char
    INT 21H

    MOV AH, 7                ; 7 dans AH pour 21 -> lecture d'un input mais dans ECHO la valeur choisi (any key pressed)
    INT 21H                  ; interuption

    MOV AH, 2                ; Meme logique que pour le mouvement du cursor
    MOV BH, 0
    MOV DH, 10
    MOV DL, 24
    INT 10H

    LEA DX, EMP             ; On met l'adresse du msg EMP (une row plein d'espace) dans DX pour clean (replacer la row par des space)
    MOV AH, 9               ; Parreil 9 dans AH pour interuption 21H = fonction qui ecrit chaine de char
    INT 21H                 ; interuption

    JMP TRYAGAIN;           ; on jupm dans cette meme fonction pour re demander y/n 

; ------- FIN DU TRY AGAIN --------  



; ----------- AI MOVE -----------
IA_MOVE:
    ; On genere un nombre random entre 1 et 9
    MOV AH, 00h   ; 00 dans registe AH pour dire que on va call l'interuption 1AH pour heure 
    INT 1AH       ; On recupère l'heure du system    -> DX et AX contient les info de heure
    MOV AX, DX    ; On met AX dans DX (AX contient heure en centieme de seconde)
    XOR DX, DX    ; on met DX a EMPTY
    MOV CX, 9     ; on met 9 dans le registre CX (le diviseur (nombre entre 0 et 8)
    DIV CX        ; DIV divise le contenu de AX par la valeurs CX (ici 9) -> le quotient arrive dans le registre AL et le reste dans AH (le reste sera donc entre 0 et 8)
    INC DX        ; INC incremente DX de 1 donc on passe de 0-8 -> 1-9
    MOV BL, DL    ; on met la valeur de BL (donc un nombre entre 1 et 9) dans DL

    ; On set l'icon courant a 'O' (car l'ia est forcement player 2 donc -> O)
    MOV CL, 79

    ; On check si la cellule est disponible (on compare le random avec la cellule qui correspond)
    CMP BL, 1
    JZ AI_C1
    CMP BL, 2
    JZ AI_C2
    CMP BL, 3
    JZ AI_C3
    CMP BL, 4
    JZ AI_C4
    CMP BL, 5
    JZ AI_C5
    CMP BL, 6
    JZ AI_C6
    CMP BL, 7
    JZ AI_C7
    CMP BL, 8
    JZ AI_C8
    CMP BL, 9
    JZ AI_C9

    ; Si aucune cell est dispo alors on re fait 
    JMP IA_MOVE

AI_C1:
    CMP C1, 88  ; On compare la valeur de la cellules et on regarde si il y a 'X' (rappel : 'X' = 88 ASCII)
    JZ IA_MOVE  ; Si deja prise alors on re fait AI_MOVE
    CMP C1, 79  ; On compare la valeur de la cellules et on regarde si il y a 'X' (rappel : '0' = 79 ASCII)
    JZ IA_MOVE
                  
                ; SI ON EST ICI CEST QUE l'IA PEUX PLACER 
    MOV C1, CL  ; on met 'O' dans la cellules
    JMP CHECK   ; on lance jump au check pour verifier la fin de la partie

AI_C2:
    CMP C2, 88  ; PARREIL on regarde si il y a 'X' dans C2
    JZ IA_MOVE
    CMP C2, 79  ; PARREIL on regarde si il y a 'O' dans C2
    JZ IA_MOVE

    MOV C2, CL  ; PARREIL on met 'O' dans la cellules
    JMP CHECK   

AI_C3:
    CMP C3, 88  ; PARREIL on regarde si il y a 'X' dans C3
    JZ IA_MOVE
    CMP C3, 79  ; PARREIL on regarde si il y a 'O' dans C3
    JZ IA_MOVE

    MOV C3, CL  ; PARREIL on met 'O' dans la cellules
    JMP CHECK

AI_C4:
    CMP C4, 88  ; PARREIL on regarde si il y a 'X' dans C4
    JZ IA_MOVE
    CMP C4, 79  ; PARREIL on regarde si il y a 'O' dans C4
    JZ IA_MOVE

    MOV C4, CL  ; PARREIL on met 'O' dans la cellules
    JMP CHECK

AI_C5:
    CMP C5, 88  ; PARREIL on regarde si il y a 'X' dans C5
    JZ IA_MOVE
    CMP C5, 79  ; PARREIL on regarde si il y a 'O' dans C5
    JZ IA_MOVE

    MOV C5, CL  ; PARREIL on met 'O' dans la cellules
    JMP CHECK

AI_C6:
    CMP C6, 88  ; PARREIL on regarde si il y a 'X' dans C6
    JZ IA_MOVE
    CMP C6, 79  ; PARREIL on regarde si il y a 'O' dans C6
    JZ IA_MOVE

    MOV C6, CL  ; PARREIL on met 'O' dans la cellules
    JMP CHECK

AI_C7:
    CMP C7, 88   ; PARREIL on regarde si il y a 'X' dans C4
    JZ IA_MOVE
    CMP C7, 79   ; PARREIL on regarde si il y a 'O' dans C7
    JZ IA_MOVE

    MOV C7, CL   ; PARREIL on met 'O' dans la cellules
    JMP CHECK

AI_C8:
    CMP C8, 88   ; PARREIL on regarde si il y a 'X' dans C8
    JZ IA_MOVE
    CMP C8, 79   ; PARREIL on regarde si il y a 'O' dans C8
    JZ IA_MOVE

    MOV C8, CL   ; PARREIL on met 'O' dans la cellules
    JMP CHECK

AI_C9:
    CMP C9, 88   ; PARREIL on regarde si il y a 'X' dans C9
    JZ IA_MOVE
    CMP C9, 79   ; PARREIL on regarde si il y a 'O' dans C9
    JZ IA_MOVE

    MOV C9, CL   ; PARREIL on met 'O' dans la cellules
    JMP CHECK

; ----------- FIN IA MOVE --------
                        
                        
                        
; ----------- SHOW MENU -----------
SHOW_MENU:
                            ; On clear l'ecran
    MOV AX,0600H            ; Meme logique que le EFFACER L'ECRAN pour clear le screen
    MOV BH,07H
    MOV CX,0000H
    MOV DX,184FH
    INT 10H

    MOV AH, 2               ; Meme logique que pour le mouvement du cursor
    MOV BH, 0
    MOV DH, 10
    MOV DL, 24
    INT 10H

    LEA DX, MENU            ; On met l'adresse du msg MENU dans DX
    MOV AH, 9               ; Parreil 9 dans AH pour interuption 21H = fonction qui ecrit chaine de char
    INT 21H

    MOV AH, 2               ; Meme logique que pour le mouvement du cursor
    MOV BH, 0
    MOV DH, 11
    MOV DL, 24
    INT 10H

    LEA DX, MENU2           ; On met l'adresse du msg MENU2 dans DX
    MOV AH, 9               ; Parreil 9 dans AH pour interuption 21H = fonction qui ecrit chaine de char
    INT 21H


    MOV AH, 2               ; Meme logique que pour le mouvement du cursor
    MOV BH, 0
    MOV DH, 12
    MOV DL, 24
    INT 10H

    LEA DX, MENU3           ; On met l'adresse du msg MENU3 dans DX
    MOV AH, 9               ; Parreil 9 dans AH pour interuption 21H = fonction qui ecrit chaine de char
    INT 21H

    RET                     ; on retourn dans l'appelant

; ----------- FIN DU SHOW MENU --------
              
              
              
EXIT:
    MOV AH, 4CH             ; prepare la fonction 4Ch pour terminer le programme
    INT 21H                 ; appeler l'interruption pour quitter
    MAIN ENDP               ; fin de la procedure MAIN
END MAIN                    ; tndique au compilateur que MAIN est le point d'entree du programme