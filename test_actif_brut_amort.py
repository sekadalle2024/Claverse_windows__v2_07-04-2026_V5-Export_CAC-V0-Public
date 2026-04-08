"""
Script de test pour le calcul des colonnes BRUT, AMORT ET DEPREC, NET de l'ACTIF

Date: 07 Avril 2026
"""

import sys
import os
import pandas as pd
import json

# Ajouter le chemin du backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'py_backend'))

from calculer_actif_brut_amort import (
    calculer_actif_avec_brut_amort,
    generer_html_actif_detaille,
    enrichir_actif_avec_brut_amort
)


def charger_balance_demo():
    """Charge la balance de démonstration"""
    # Chercher d'abord dans py_backend
    balance_file = "py_backend/P000 -BALANCE DEMO N_N-1_N-2.xls"
    
    if not os.path.exists(balance_file):
        # Essayer dans le répertoire courant
        balance_file = "P000 -BALANCE DEMO N_N-1_N-2.xls"
        if not os.path.exists(balance_file):
            print(f"❌ Fichier non trouvé: {balance_file}")
            print(f"   Cherché dans: py_backend/ et répertoire courant")
            return None
    
    try:
        # Lire l'onglet BALANCE N (avec espace à la fin)
        df = pd.read_excel(balance_file, sheet_name="BALANCE N ")
        print(f"✅ Balance chargée: {len(df)} lignes")
        print(f"   Colonnes: {df.columns.tolist()}")
        return df
    except Exception as e:
        print(f"❌ Erreur lors du chargement: {e}")
        return None


def charger_correspondances():
    """Charge le fichier de correspondances"""
    corresp_file = "py_backend/correspondances_syscohada.json"
    
    if not os.path.exists(corresp_file):
        print(f"❌ Fichier non trouvé: {corresp_file}")
        return None
    
    try:
        with open(corresp_file, 'r', encoding='utf-8') as f:
            correspondances = json.load(f)
        print(f"✅ Correspondances chargées:")
        print(f"   - Bilan Actif: {len(correspondances['bilan_actif'])} postes")
        return correspondances
    except Exception as e:
        print(f"❌ Erreur lors du chargement: {e}")
        return None


def detecter_colonnes(df):
    """Détecte les colonnes de la balance"""
    columns = df.columns.tolist()
    columns_lower = [str(c).lower().strip() for c in columns]
    
    mapping = {
        'numero': None,
        'intitule': None,
        'solde_debit': None,
        'solde_credit': None
    }
    
    for idx, col in enumerate(columns_lower):
        original_col = columns[idx]
        
        if 'numéro' in col or 'numero' in col:
            mapping['numero'] = original_col
        
        if 'intitulé' in col or 'intitule' in col:
            mapping['intitule'] = original_col
        
        if 'solde' in col and 'débit' in col:
            mapping['solde_debit'] = original_col
        elif 'solde' in col and 'debit' in col:
            mapping['solde_debit'] = original_col
        
        if 'solde' in col and 'crédit' in col:
            mapping['solde_credit'] = original_col
        elif 'solde' in col and 'credit' in col:
            mapping['solde_credit'] = original_col
    
    print(f"✅ Colonnes détectées: {mapping}")
    return mapping


def afficher_resultats(actif_detaille):
    """Affiche les résultats du calcul"""
    print("\n" + "="*80)
    print("📊 RÉSULTATS DU CALCUL - ACTIF AVEC BRUT, AMORT, NET")
    print("="*80)
    
    # Postes avec des valeurs
    postes_avec_valeurs = {ref: data for ref, data in actif_detaille.items() 
                           if data['brut'] > 0 or data['amort_deprec'] > 0}
    
    print(f"\n✅ {len(postes_avec_valeurs)} postes avec des valeurs\n")
    
    # Afficher les détails
    for ref, data in sorted(postes_avec_valeurs.items()):
        print(f"\n{ref} - {data['libelle']}")
        print(f"   BRUT:           {data['brut']:>15,.0f}")
        print(f"   AMORT ET DEPREC: {data['amort_deprec']:>15,.0f}")
        print(f"   NET:            {data['net']:>15,.0f}")
        
        if data['comptes_brut']:
            print(f"   Comptes bruts ({len(data['comptes_brut'])}):")
            for compte in data['comptes_brut'][:3]:  # Afficher max 3 comptes
                print(f"      - {compte['numero']}: {compte['montant']:,.0f}")
        
        if data['comptes_amort']:
            print(f"   Comptes amort/prov ({len(data['comptes_amort'])}):")
            for compte in data['comptes_amort'][:3]:
                print(f"      - {compte['numero']}: {compte['montant']:,.0f}")
    
    # Afficher les totaux
    print("\n" + "="*80)
    print("📈 TOTAUX")
    print("="*80)
    
    for ref in ['AZ', 'BP', 'BT', 'BZ']:
        if ref in actif_detaille:
            data = actif_detaille[ref]
            print(f"\n{ref} - {data['libelle']}")
            print(f"   BRUT:           {data['brut']:>15,.0f}")
            print(f"   AMORT ET DEPREC: {data['amort_deprec']:>15,.0f}")
            print(f"   NET:            {data['net']:>15,.0f}")


def sauvegarder_html(html, filename="test_actif_brut_amort.html"):
    """Sauvegarde le HTML généré"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"\n✅ HTML sauvegardé: {filename}")
        
        # Ouvrir dans le navigateur
        import webbrowser
        webbrowser.open(filename)
        print(f"✅ Ouverture dans le navigateur...")
    except Exception as e:
        print(f"❌ Erreur lors de la sauvegarde: {e}")


def main():
    """Fonction principale de test"""
    print("="*80)
    print("🧪 TEST - Calcul ACTIF avec BRUT, AMORT ET DEPREC, NET")
    print("="*80)
    
    # 1. Charger la balance
    print("\n1️⃣ Chargement de la balance...")
    balance_df = charger_balance_demo()
    if balance_df is None:
        return
    
    # 2. Charger les correspondances
    print("\n2️⃣ Chargement des correspondances...")
    correspondances = charger_correspondances()
    if correspondances is None:
        return
    
    # 3. Détecter les colonnes
    print("\n3️⃣ Détection des colonnes...")
    col_map = detecter_colonnes(balance_df)
    
    # 4. Calculer l'actif détaillé
    print("\n4️⃣ Calcul de l'actif détaillé...")
    try:
        actif_detaille = calculer_actif_avec_brut_amort(balance_df, correspondances, col_map)
        print("✅ Calcul terminé")
    except Exception as e:
        print(f"❌ Erreur lors du calcul: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 5. Afficher les résultats
    print("\n5️⃣ Affichage des résultats...")
    afficher_resultats(actif_detaille)
    
    # 6. Générer le HTML
    print("\n6️⃣ Génération du HTML...")
    try:
        html = generer_html_actif_detaille(actif_detaille)
        print("✅ HTML généré")
    except Exception as e:
        print(f"❌ Erreur lors de la génération HTML: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 7. Sauvegarder et ouvrir
    print("\n7️⃣ Sauvegarde du HTML...")
    sauvegarder_html(html)
    
    print("\n" + "="*80)
    print("✅ TEST TERMINÉ AVEC SUCCÈS")
    print("="*80)


if __name__ == "__main__":
    main()
