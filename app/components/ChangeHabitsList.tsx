import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, TextInput} from 'react-native';
import {Habit} from '../types/types';
import {IconButton} from 'react-native-paper';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import SwipeableItem from 'react-native-swipeable-item';
import {deleteHabit, updateHabit, updateHabitsBatch} from '../api/habits';
import {toDateId} from '@marceloterreiro/flash-calendar';

function ChangeHabitsList(props: {habits: Habit[]}) {
  const [habits, setHabits] = useState<Habit[]>(props.habits);

  useEffect(() => {
    setHabits(props.habits);
  }, [props.habits]);

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteHabit(1, id, toDateId(new Date()));
      const prevHabits = habits.filter(habit => habit.id !== id);
      updateHabitsSortOrder(prevHabits);
    },
    [habits],
  );

  const handleLocalHabitNameChange = (id: number, newName: string) => {
    setHabits(prevHabits =>
      prevHabits.map(habit =>
        habit.id === id ? {...habit, name: newName} : habit,
      ),
    );
  };

  const updateHabitsSortOrder = async (sortedHabits: Habit[]) => {
    const updatedHabits = sortedHabits.map((habit: Habit, index: number) => ({
      ...habit,
      sortOrder: index,
    }));

    setHabits(updatedHabits);

    try {
      await updateHabitsBatch(1, updatedHabits);
    } catch (error) {
      console.error('Failed to update sort order', error);
    }
  };

  const onUpdateHabitName = useCallback(
    async (id: number, updatedName: string, sortOrder: number) => {
      if (updatedName.length === 0) {
        handleDelete(id);
      } else {
        await updateHabit(1, id, updatedName, sortOrder);
      }
    },
    [handleDelete],
  );

  const renderItem = useCallback(
    ({item, drag}: RenderItemParams<Habit>) => {
      return (
        <SwipeableItem
          key={item.id}
          item={item}
          snapPointsLeft={[68]}
          swipeDamping={1}
          renderUnderlayLeft={() => (
            <View style={styles.deleteHabitButtonWrapper}>
              <IconButton
                style={styles.icon}
                icon="delete-outline"
                iconColor={'darkred'}
                size={48}
                onPress={() => handleDelete(item.id)}
              />
            </View>
          )}>
          <View style={styles.habitWrapper} key={item.id}>
            <TextInput
              style={styles.habitName}
              value={item.name}
              onChangeText={text => handleLocalHabitNameChange(item.id, text)}
              onBlur={() =>
                onUpdateHabitName(item.id, item.name, item.sortOrder)
              }
            />

            <IconButton
              style={styles.icon}
              icon="menu"
              iconColor={'lightgray'}
              size={48}
              onLongPress={drag}
            />
          </View>
        </SwipeableItem>
      );
    },
    [handleDelete, onUpdateHabitName],
  );

  return (
    <GestureHandlerRootView>
      <DraggableFlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={item => `draggable-item-${item.id}`}
        onDragEnd={({data}) => updateHabitsSortOrder(data)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  deleteHabitButtonWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '100%',
    height: '100%',
    paddingBottom: '5%',
  },
  habitName: {
    fontSize: 24,
    fontWeight: 200,
    width: '60%',
  },
  habitWrapper: {
    borderRadius: 16,
    borderColor: 'lightgray',
    borderWidth: 1,
    borderStyle: 'solid',
    padding: 16,
    marginBottom: 16,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    margin: 0,
  },
});

export default ChangeHabitsList;
