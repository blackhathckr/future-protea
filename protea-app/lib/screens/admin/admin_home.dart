import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../players/players_home_screen.dart';
import '../teams/teams_home_screen.dart';
import '../tournaments/tournament_home_screen.dart';
import 'admin_dashboard.dart';

class AdminHome extends StatefulWidget {
  const AdminHome({super.key});

  @override
  State<AdminHome> createState() => _AdminHomeState();
}

class _AdminHomeState extends State<AdminHome> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: const [
          AdminDashboard(),
          TournamentHomeScreen(),
          TeamsHomeScreen(),
          PlayersHomeScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? AppTheme.darkCardBg
            : Colors.white,
        indicatorColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        height: 70,
        destinations: [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppTheme.primaryGreen),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon: Icon(Icons.emoji_events, color: AppTheme.primaryGreen),
            label: 'Tournaments',
          ),
          NavigationDestination(
            icon: Icon(Icons.shield_outlined),
            selectedIcon: Icon(Icons.shield, color: AppTheme.primaryGreen),
            label: 'Teams',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: AppTheme.primaryGreen),
            label: 'Players',
          ),
        ],
      ),
    );
  }
}
