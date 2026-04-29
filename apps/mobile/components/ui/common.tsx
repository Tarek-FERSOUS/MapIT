import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  SafeAreaView
} from "react-native";
import { getIncidentStatusColor, getIncidentPriorityColor, getProblemSeverityColor, getAssetStatusColor } from "../../utils/formatting";

// Theme constants
export const COLORS = {
  primary: "#1E40AF",
  primaryLight: "#3B82F6",
  secondary: "#10B981",
  accent: "#F59E0B",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",
  text: {
    primary: "#0F172A",
    secondary: "#475569",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF"
  },
  status: {
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6"
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32
};

// Loading Spinner
interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
}

export function LoadingSpinner({
  size = "large",
  color = COLORS.primary
}: LoadingSpinnerProps) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

// Error Alert
interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.errorCloseButton}>
          <Text style={styles.errorCloseText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Success Alert
interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
}

export function SuccessAlert({ message, onDismiss }: SuccessAlertProps) {
  return (
    <View style={styles.successContainer}>
      <Text style={styles.successText}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.successCloseButton}>
          <Text style={styles.successCloseText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Button
interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  full?: boolean;
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  full = false
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        full && styles.buttonFull,
        isDisabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? COLORS.text.inverse : COLORS.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            styles[`buttonText_${variant}`]
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// Input Field
interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  label?: string;
}

export function Input({
  placeholder,
  value,
  onChangeText,
  editable = true,
  secureTextEntry = false,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  error,
  label
}: InputProps) {
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          !editable && styles.inputDisabled,
          error && styles.inputError
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor={COLORS.text.tertiary}
      />
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// Card
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export function Card({ children, onPress, style }: CardProps) {
  const content = (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// Badge
interface BadgeProps {
  text: string;
  type?: "default" | "success" | "warning" | "error" | "info";
}

export function Badge({ text, type = "default" }: BadgeProps) {
  const badgeStyle = type === "default" ? styles.badge : styles[`badge_${type}`];
  const textStyle = type === "default" ? styles.badgeText : styles[`badgeText_${type}`];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{text}</Text>
    </View>
  );
}

// Status Badge
interface StatusBadgeProps {
  status: string;
  type?: "incident" | "problem" | "asset";
}

export function StatusBadge({ status, type = "incident" }: StatusBadgeProps) {
  let color = COLORS.text.tertiary;

  if (type === "incident") {
    color = getIncidentStatusColor(status);
  } else if (type === "problem") {
    color = getProblemSeverityColor(status);
  } else if (type === "asset") {
    color = getAssetStatusColor(status);
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: color + "20", borderColor: color }]}>
      <Text style={[styles.statusBadgeText, { color }]}>
        {status}
      </Text>
    </View>
  );
}

// Section Header
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

// Empty State
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {description && <Text style={styles.emptyStateDescription}>{description}</Text>}
      {action && <View style={{ marginTop: SPACING.lg }}>{action}</View>}
    </View>
  );
}

// List Item
interface ListItemProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
}

export function ListItem({ title, subtitle, rightContent, onPress }: ListItemProps) {
  const content = (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightContent && <View>{rightContent}</View>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// Safe Area Container
interface SafeAreaContainerProps {
  children: React.ReactNode;
  style?: any;
}

export function SafeAreaContainer({ children, style }: SafeAreaContainerProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {children}
    </SafeAreaView>
  );
}

// Divider
export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl
  },

  // Error & Success
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.status.error,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  errorText: {
    color: "#7F1D1D",
    fontSize: 14,
    flex: 1,
    marginRight: SPACING.md
  },
  errorCloseButton: {
    padding: SPACING.sm
  },
  errorCloseText: {
    color: "#7F1D1D",
    fontSize: 16,
    fontWeight: "bold"
  },

  successContainer: {
    backgroundColor: "#D1FAE5",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.status.success,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  successText: {
    color: "#065F46",
    fontSize: 14,
    flex: 1,
    marginRight: SPACING.md
  },
  successCloseButton: {
    padding: SPACING.sm
  },
  successCloseText: {
    color: "#065F46",
    fontSize: 16,
    fontWeight: "bold"
  },

  // Button
  button: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm
  },
  button_primary: {
    backgroundColor: COLORS.primary
  },
  button_secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  button_danger: {
    backgroundColor: COLORS.status.error
  },
  button_ghost: {
    backgroundColor: "transparent"
  },
  button_sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 32
  },
  button_md: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 40
  },
  button_lg: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: 48
  },
  buttonFull: {
    width: "100%"
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600"
  },
  buttonText_primary: {
    color: COLORS.text.inverse
  },
  buttonText_secondary: {
    color: COLORS.primary
  },
  buttonText_danger: {
    color: COLORS.text.inverse
  },
  buttonText_ghost: {
    color: COLORS.primary
  },

  // Input
  inputContainer: {
    marginVertical: SPACING.md
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: SPACING.sm
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
    minHeight: 40
  },
  inputDisabled: {
    backgroundColor: COLORS.surface,
    color: COLORS.text.tertiary
  },
  inputError: {
    borderColor: COLORS.status.error
  },
  inputErrorText: {
    color: COLORS.status.error,
    fontSize: 12,
    marginTop: SPACING.xs
  },

  // Card
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginVertical: SPACING.md
  },

  // Badge
  badge: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignSelf: "flex-start"
  },
  badge_success: {
    backgroundColor: "#D1FAE5"
  },
  badge_warning: {
    backgroundColor: "#FEF3C7"
  },
  badge_error: {
    backgroundColor: "#FEE2E2"
  },
  badge_info: {
    backgroundColor: "#DBEAFE"
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.secondary
  },
  badgeText_success: {
    color: "#065F46"
  },
  badgeText_warning: {
    color: "#78350F"
  },
  badgeText_error: {
    color: "#7F1D1D"
  },
  badgeText_info: {
    color: "#1E3A8A"
  },

  // Status Badge
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignSelf: "flex-start"
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600"
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.primary
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.sm
  },
  emptyStateDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center"
  },

  // List Item
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  listItemContent: {
    flex: 1
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary
  },
  listItemSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs
  },

  // Safe Area
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg
  }
});
