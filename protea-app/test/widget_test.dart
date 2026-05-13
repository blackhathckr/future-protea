import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:cricket_app/main.dart';
import 'package:cricket_app/providers/auth_provider.dart';

void main() {
  testWidgets('App renders without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const FutureProteaApp(),
      ),
    );
    await tester.pump();
    expect(find.byType(FutureProteaApp), findsOneWidget);
  });
}
