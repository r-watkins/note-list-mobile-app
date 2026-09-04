import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Text, View, Pressable, type ViewProps, type PressableProps } from 'react-native';

import { cn } from '@/lib/utils';

type SheetContextValue = {
  modalRef: React.RefObject<React.ElementRef<typeof BottomSheetModal> | null>;
  open: () => void;
  close: () => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet subcomponents must be rendered within a <Sheet>.');
  }
  return context;
}

type SheetProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function Sheet({ children, open, onOpenChange }: SheetProps) {
  const modalRef = React.useRef<React.ElementRef<typeof BottomSheetModal>>(null);

  const openSheet = React.useCallback(() => modalRef.current?.present(), []);
  const closeSheet = React.useCallback(() => modalRef.current?.dismiss(), []);

  React.useEffect(() => {
    if (open === undefined) return;
    if (open) openSheet();
    else closeSheet();
  }, [open, openSheet, closeSheet]);

  const handleDismiss = React.useCallback(() => onOpenChange?.(false), [onOpenChange]);

  const value = React.useMemo(
    () => ({ modalRef, open: openSheet, close: closeSheet }),
    [openSheet, closeSheet],
  );

  return (
    <SheetContext.Provider value={value}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (child.type === SheetContent) {
          return React.cloneElement(child as React.ReactElement<SheetContentProps>, {
            onDismiss: handleDismiss,
          });
        }
        return child;
      })}
    </SheetContext.Provider>
  );
}

type TriggerProps = PressableProps & { asChild?: boolean };

function SheetTrigger({ children, onPress, asChild, ...props }: TriggerProps) {
  const { open } = useSheetContext();
  const handlePress: PressableProps['onPress'] = (event) => {
    onPress?.(event);
    open();
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ onPress?: PressableProps['onPress'] }>,
      { onPress: handlePress },
    );
  }
  return (
    <Pressable onPress={handlePress} {...props}>
      {children}
    </Pressable>
  );
}

function SheetClose({ children, onPress, asChild, ...props }: TriggerProps) {
  const { close } = useSheetContext();
  const handlePress: PressableProps['onPress'] = (event) => {
    onPress?.(event);
    close();
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ onPress?: PressableProps['onPress'] }>,
      { onPress: handlePress },
    );
  }
  return (
    <Pressable onPress={handlePress} {...props}>
      {children}
    </Pressable>
  );
}

type SheetContentProps = {
  className?: string;
  children?: React.ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
};

function SheetContent({
  className,
  children,
  snapPoints: snapPointsProp,
  onDismiss,
}: SheetContentProps) {
  const { modalRef } = useSheetContext();
  const snapPoints = React.useMemo(() => snapPointsProp ?? ['50%'], [snapPointsProp]);

  const renderBackdrop = React.useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'hsl(var(--background))' }}
      handleIndicatorStyle={{ backgroundColor: 'hsl(var(--border))' }}
    >
      <BottomSheetView className={cn('flex-1 gap-4 px-4 pb-8 pt-2', className)}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function SheetHeader({ className, ...props }: ViewProps) {
  return <View className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function SheetFooter({ className, ...props }: ViewProps) {
  return <View className={cn('mt-auto flex flex-col gap-2', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn('text-foreground text-lg font-semibold leading-none', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
