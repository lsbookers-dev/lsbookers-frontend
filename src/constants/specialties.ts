// Spécialités par rôle — source unique de vérité pour tout le projet
export const SPECIALTIES_BY_ROLE: Record<string, string[]> = {
  ARTIST: [
    'Acrobate', 'Accordéoniste', 'Animateur', 'Artiste de cirque',
    'Bassiste', 'Batteur', 'Chanteur(se)', 'Chorale', 'Clown', 'Comédien',
    'Cracheur de feu', 'Danseur LED', 'Danseur(se)', 'DJ', 'Échassier',
    'Fanfare', 'Graffeur', 'Groupe', 'Groupe de danse', 'Guitariste',
    'Humoriste', 'Hypnotiseur', 'Imitateur', 'Influenceur / Créateur de contenu',
    'Jongleur', 'Magicien', 'Maître de cérémonie', 'Mentaliste', 'Mime',
    'Orchestre', 'Peintre Live', 'Percussionniste', 'Performer', 'Pianiste',
    'Présentateur', 'Saxophoniste', 'Sculpteur Live', 'Speed Painter',
    'Stand-upper', 'Streamer', 'Trompettiste', 'Violoncelliste', 'Violoniste',
  ],
  ORGANIZER: [
    'Agence événementielle', 'Anniversaire', 'Arena', 'Association',
    'Baptême', 'Bar', 'Beach Club', 'Camping', 'Casino',
    'Centre commercial', 'Centre culturel', 'Château', 'Collectivité',
    'Comité des fêtes', 'Congrès', 'Discothèque / Club', 'Domaine',
    'Entreprise / CE', 'Événement sportif', 'Festival', 'Gala', 'Hôtel',
    'Lancement de produit', 'Mairie', 'Mariage', 'Organisateur de soirées',
    'Palais des congrès', "Parc d'attractions", 'Plage privée', 'Pub',
    'Restaurant', 'Rooftop', 'Salle de réception', 'Salle de spectacle',
    'Salle des fêtes', 'Salon professionnel', 'Séminaire', 'Soirée étudiante',
    'Soirée privée', 'Théâtre', 'Village vacances', 'Wedding Planner', 'Zénith',
  ],
  PROVIDER: [
    'Arche de cérémonie', 'Baby-sitter événementielle', 'Ballons', 'Barman',
    'Borne 360°', 'Cake Designer', 'Chauffeur privé', 'Chef à domicile',
    'Coiffeur', "Contrôle d'accès", 'Costumier', 'Décorateur',
    'Designer événementiel', 'DJ Tech', 'Drone', 'Éclairagiste',
    'Effets spéciaux', 'Fleuriste', 'Food Truck', 'Glacier',
    "Hôtesse d'accueil", 'Location de matériel', 'Location de sonorisation',
    'Location limousine', 'Location lumière', 'Location mobilier',
    'Location scène', 'Location vaisselle', 'Location véhicules',
    'Maquilleur', 'Monteur vidéo', 'Nettoyage', 'Pâtissier',
    'Photographe', 'Photobooth', 'Pyrotechnicien', 'Régisseur',
    'Régisseur général', 'Régisseur plateau', 'Retouche photo',
    'Scène', 'Sécurité', 'Serveur', 'Serveuse', 'Signalétique',
    'Sommelier', 'Sonorisateur', 'Structure', 'Styliste',
    'Technicien audiovisuel', 'Technicien lumière', 'Technicien son',
    'Traiteur', 'Transport de matériel', 'Vidéaste', 'Vidéoprojection', 'Voiturier',
  ],
}

/** Retourne les spécialités disponibles pour un type d'offre donné */
export function getSpecialtiesForOfferType(type: 'ARTIST' | 'PROVIDER' | 'ALL'): string[] {
  if (type === 'ALL') return [...SPECIALTIES_BY_ROLE.ARTIST, ...SPECIALTIES_BY_ROLE.PROVIDER].sort()
  return SPECIALTIES_BY_ROLE[type] ?? []
}
