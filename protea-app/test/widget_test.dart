import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:cricket_app/main.dart';
import 'package:cricket_app/services/auth_provider.dart';

void main() {
  testWidgets('App renders login screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const FutureProteaApp(),
      ),
    );
    await tester.pump();
    expect(find.text('CrickScore'), findsAny);
  });
}
