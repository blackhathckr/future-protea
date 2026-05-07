class Player {
  final int id;
  final String name;
  final String? playerId; // e.g. GUCT-0158
  final String? dateOfBirth;
  
  // Contact Information
  final String? email;
  final String? phone;
  final String? emergencyContact;
  final String? emergencyContactName;
  
  // Address
  final String? address;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  
  // Physical Stats
  final double? height; // in cm
  final double? weight; // in kg
  final String? bloodGroup;
  
  // Cricket Details
  final String? schoolName;
  final String? clubName;
  final String? battingStyle;
  final String? bowlingStyle;
  final String? playingRole;
  final int? jerseyNumber;
  
  // Additional Info
  final String? photoUrl;
  final String? fatherName;
  final String? motherName;
  final String? guardianName;
  final String? nationality;
  
  final List<String>? teamsPlayed;
  final int? createdBy;

  Player({
    required this.id,
    required this.name,
    this.playerId,
    this.dateOfBirth,
    this.email,
    this.phone,
    this.emergencyContact,
    this.emergencyContactName,
    this.address,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.height,
    this.weight,
    this.bloodGroup,
    this.schoolName,
    this.clubName,
    this.battingStyle,
    this.bowlingStyle,
    this.playingRole,
    this.jerseyNumber,
    this.photoUrl,
    this.fatherName,
    this.motherName,
    this.guardianName,
    this.nationality,
    this.teamsPlayed,
    this.createdBy,
  });

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      id: json['id'],
      name: json['name'] ?? '',
      playerId: json['player_id_code'] ?? json['player_id'],
      dateOfBirth: json['date_of_birth'] ?? json['dob'],
      email: json['email'],
      phone: json['phone'],
      emergencyContact: json['emergency_contact'],
      emergencyContactName: json['emergency_contact_name'],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      country: json['country'],
      postalCode: json['postal_code'],
      height: json['height']?.toDouble(),
      weight: json['weight']?.toDouble(),
      bloodGroup: json['blood_group'],
      schoolName: json['school_name'],
      clubName: json['club_name'],
      battingStyle: json['batting_style'],
      bowlingStyle: json['bowling_style'],
      playingRole: json['playing_role'],
      jerseyNumber: json['jersey_number'],
      photoUrl: json['photo_url'],
      fatherName: json['father_name'],
      motherName: json['mother_name'],
      guardianName: json['guardian_name'],
      nationality: json['nationality'],
      teamsPlayed: json['teams_played'] != null
          ? List<String>.from(json['teams_played'])
          : null,
      createdBy: json['created_by'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'date_of_birth': dateOfBirth,
      'email': email,
      'phone': phone,
      'emergency_contact': emergencyContact,
      'emergency_contact_name': emergencyContactName,
      'address': address,
      'city': city,
      'state': state,
      'country': country,
      'postal_code': postalCode,
      'height': height,
      'weight': weight,
      'blood_group': bloodGroup,
      'school_name': schoolName,
      'club_name': clubName,
      'batting_style': battingStyle,
      'bowling_style': bowlingStyle,
      'playing_role': playingRole,
      'jersey_number': jerseyNumber,
      'father_name': fatherName,
      'mother_name': motherName,
      'guardian_name': guardianName,
      'nationality': nationality,
    };
  }
}
