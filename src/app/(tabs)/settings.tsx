import { useRouter } from 'expo-router';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { seedDatabase } from '@/db/seed';

function DevSeedButton() {
  return (
    <Button
      variant="outline"
      onPress={() => {
        const result = seedDatabase();
        Alert.alert(
          result.seeded ? 'Seeded' : 'Skipped',
          result.seeded ? 'Sample data added.' : 'Data already exists.',
        );
      }}
    >
      <Text>Seed sample data (dev only)</Text>
    </Button>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-xl font-semibold">Settings</Text>
      <Button variant="outline" onPress={() => router.push('/labels')}>
        <Text>Manage labels</Text>
      </Button>
      {__DEV__ ? <DevSeedButton /> : null}
    </View>
  );
}
