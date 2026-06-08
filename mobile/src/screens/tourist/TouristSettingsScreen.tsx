import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '../../context/PreferencesContext';

const languages = [
  { code: 'es', label: 'Espanol' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Portugues' },
] as const;

const socialLinks = [
  { label: 'Facebook', icon: 'logo-facebook', url: 'https://www.facebook.com/municipiosr/' },
  { label: 'YouTube', icon: 'logo-youtube', url: 'https://www.youtube.com/channel/UCgaGV99aMfrmnThzoO1dqJg' },
  { label: 'X', icon: 'logo-twitter', url: 'https://twitter.com/municipiosr' },
  { label: 'Instagram', icon: 'logo-instagram', url: 'https://www.instagram.com/gad_santarosa_ec/' },
] as const;

const copy = {
  es: {
    title: 'Configuracion',
    subtitle: 'Ajustes de experiencia para visitantes y accesos internos.',
    darkMode: 'Modo oscuro',
    darkModeText: 'Reduce brillo y usa una interfaz mas comoda de noche.',
    language: 'Idioma',
    alerts: 'Alertas turisticas',
    alertsText: 'Avisos sobre eventos, transporte y novedades del GAD.',
    tools: 'Herramientas rapidas',
    scanQr: 'Escanear codigo QR',
    favorites: 'Ver favoritos offline',
    internal: 'Acceso interno',
    internalText: 'Para administradores, editores y negocios registrados.',
    business: 'Acceso a negocios',
    institutionTitle: 'Santa Rosa',
    institutionSubtitle: 'EL ORO - ECUADOR',
    institutionText: 'Santa Rosa, La Benemerita, es un paraiso costero. Archipielagos, gastronomia del mar y cultura unica te esperan.',
    discover: 'Descubre',
    contact: 'Contacto',
    writeUs: 'Escribenos',
    namePlaceholder: 'Tu nombre',
    emailPlaceholder: 'Tu correo electronico',
    messagePlaceholder: 'Tu mensaje...',
    sendMessage: 'Enviar mensaje',
    location: 'Santa Rosa, El Oro, Ecuador',
    phone: '+593 7 294-xxxx',
    email: 'info@visitsantarosa.ec',
    schedule: 'Lun-Vie: 8h00-17h00',
    events: 'Eventos 2026',
    touristInfo: 'Informacion Turistica',
    gallery: 'Galeria',
    activities: 'Actividades',
    copyright: '2026 Santa Rosa - Municipio de Santa Rosa, El Oro, Ecuador',
    credit: 'Hecho por el grupo de desarrollo PPN DEV',
  },
  en: {
    title: 'Settings',
    subtitle: 'Visitor experience settings and internal access.',
    darkMode: 'Dark mode',
    darkModeText: 'Reduces brightness and makes the app more comfortable at night.',
    language: 'Language',
    alerts: 'Tourism alerts',
    alertsText: 'Notices about events, transport and city updates.',
    tools: 'Quick tools',
    scanQr: 'Scan QR code',
    favorites: 'View offline favorites',
    internal: 'Internal access',
    internalText: 'For administrators, editors and registered businesses.',
    business: 'Business access',
    institutionTitle: 'Santa Rosa',
    institutionSubtitle: 'EL ORO - ECUADOR',
    institutionText: 'Santa Rosa is a coastal destination with islands, seafood gastronomy and a unique local culture.',
    discover: 'Discover',
    contact: 'Contact',
    writeUs: 'Write to us',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'Your email',
    messagePlaceholder: 'Your message...',
    sendMessage: 'Send message',
    location: 'Santa Rosa, El Oro, Ecuador',
    phone: '+593 7 294-xxxx',
    email: 'info@visitsantarosa.ec',
    schedule: 'Mon-Fri: 8:00-17:00',
    events: 'Events 2026',
    touristInfo: 'Tourist information',
    gallery: 'Gallery',
    activities: 'Activities',
    copyright: '2026 Santa Rosa - Municipality of Santa Rosa, El Oro, Ecuador',
    credit: 'Made by the PPN DEV development group',
  },
  pt: {
    title: 'Configuracoes',
    subtitle: 'Ajustes da experiencia do visitante e acesso interno.',
    darkMode: 'Modo escuro',
    darkModeText: 'Reduz o brilho e deixa o app mais confortavel a noite.',
    language: 'Idioma',
    alerts: 'Alertas turisticos',
    alertsText: 'Avisos sobre eventos, transporte e novidades do GAD.',
    tools: 'Ferramentas rapidas',
    scanQr: 'Escanear codigo QR',
    favorites: 'Ver favoritos offline',
    internal: 'Acesso interno',
    internalText: 'Para administradores, editores e negocios registrados.',
    business: 'Acesso a negocios',
    institutionTitle: 'Santa Rosa',
    institutionSubtitle: 'EL ORO - EQUADOR',
    institutionText: 'Santa Rosa e um destino costeiro com arquipelagos, gastronomia do mar e cultura local unica.',
    discover: 'Descubra',
    contact: 'Contato',
    writeUs: 'Escreva-nos',
    namePlaceholder: 'Seu nome',
    emailPlaceholder: 'Seu email',
    messagePlaceholder: 'Sua mensagem...',
    sendMessage: 'Enviar mensagem',
    location: 'Santa Rosa, El Oro, Equador',
    phone: '+593 7 294-xxxx',
    email: 'info@visitsantarosa.ec',
    schedule: 'Seg-Sex: 8h00-17h00',
    events: 'Eventos 2026',
    touristInfo: 'Informacao turistica',
    gallery: 'Galeria',
    activities: 'Atividades',
    copyright: '2026 Santa Rosa - Municipio de Santa Rosa, El Oro, Equador',
    credit: 'Feito pelo grupo de desenvolvimento PPN DEV',
  },
};

export default function TouristSettingsScreen({ navigation }: any) {
  const {
    darkMode,
    notificationsEnabled,
    language,
    setDarkMode,
    setNotificationsEnabled,
    setLanguage,
  } = usePreferences();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const theme = darkMode ? dark : light;
  const t = copy[language];

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el enlace.'));
  };

  const sendContactMessage = () => {
    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const message = contactForm.message.trim();

    if (!name || !email || !message) {
      Alert.alert('Formulario incompleto', 'Completa nombre, correo y mensaje.');
      return;
    }

    const subject = encodeURIComponent(`Mensaje desde app mobile - ${name}`);
    const body = encodeURIComponent(`${message}\n\nNombre: ${name}\nCorreo: ${email}`);
    openUrl(`mailto:${t.email}?subject=${subject}&body=${body}`);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{t.subtitle}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.settingRow}>
          <View style={[styles.iconWrap, { backgroundColor: darkMode ? '#164e63' : '#e0f2fe' }]}>
            <Ionicons name={darkMode ? 'moon' : 'sunny-outline'} size={21} color="#0891b2" />
          </View>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>{t.darkMode}</Text>
            <Text style={[styles.settingText, { color: theme.muted }]}>{t.darkModeText}</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#cbd5e1', true: '#67e8f9' }}
            thumbColor={darkMode ? '#0891b2' : '#f8fafc'}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{t.language}</Text>
        <View style={styles.languageRow}>
          {languages.map((item) => {
            const active = language === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.languageButton,
                  { borderColor: active ? '#0891b2' : theme.border, backgroundColor: active ? '#0891b2' : theme.soft },
                ]}
                onPress={() => setLanguage(item.code)}
              >
                <Text style={[styles.languageText, { color: active ? '#ffffff' : theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.settingRow}>
          <View style={[styles.iconWrap, { backgroundColor: darkMode ? '#312e81' : '#eef2ff' }]}>
            <Ionicons name="notifications-outline" size={21} color="#4f46e5" />
          </View>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>{t.alerts}</Text>
            <Text style={[styles.settingText, { color: theme.muted }]}>{t.alertsText}</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#cbd5e1', true: '#a5b4fc' }}
            thumbColor={notificationsEnabled ? '#4f46e5' : '#f8fafc'}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{t.tools}</Text>
        <TouchableOpacity style={[styles.actionRow, { borderColor: theme.border }]} onPress={() => navigation.navigate('QR')}>
          <Ionicons name="qr-code-outline" size={21} color="#0891b2" />
          <Text style={[styles.actionText, { color: theme.text }]}>{t.scanQr}</Text>
          <Ionicons name="chevron-forward-outline" size={18} color={theme.muted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionRow, { borderColor: theme.border }]} onPress={() => navigation.navigate('Favoritos')}>
          <Ionicons name="heart-outline" size={21} color="#dc2626" />
          <Text style={[styles.actionText, { color: theme.text }]}>{t.favorites}</Text>
          <Ionicons name="chevron-forward-outline" size={18} color={theme.muted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{t.internal}</Text>
        <Text style={[styles.settingText, { color: theme.muted, marginBottom: 12 }]}>{t.internalText}</Text>
        <TouchableOpacity style={styles.businessButton} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="business-outline" size={19} color="#ffffff" />
          <Text style={styles.businessButtonText}>{t.business}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.footerBlock, { backgroundColor: theme.footer, borderColor: theme.border }]}>
        <View style={styles.brandRow}>
          <Image source={require('../../../assets/icon.png')} style={styles.brandLogo} />
          <View>
            <Text style={styles.brandTitle}>{t.institutionTitle}</Text>
            <Text style={styles.brandSubtitle}>{t.institutionSubtitle}</Text>
          </View>
        </View>
        <Text style={styles.brandDescription}>{t.institutionText}</Text>

        <View style={styles.socialRow}>
          {socialLinks.map((link) => (
            <TouchableOpacity key={link.label} style={styles.socialButton} onPress={() => openUrl(link.url)}>
              <Ionicons name={link.icon as any} size={20} color="#ffffff" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>{t.discover}</Text>
          <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Catálogo', { initialType: 'eventos' })}>
            <Text style={styles.footerLinkText}>{t.events}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Catálogo')}>
            <Text style={styles.footerLinkText}>{t.touristInfo}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Inicio')}>
            <Text style={styles.footerLinkText}>{t.gallery}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Catálogo', { initialType: 'actividades' })}>
            <Text style={styles.footerLinkText}>{t.activities}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>{t.contact}</Text>
          <View style={styles.contactRow}>
            <Ionicons name="location" size={19} color="#cbd5e1" />
            <Text style={styles.contactText}>{t.location}</Text>
          </View>
          <TouchableOpacity style={styles.contactRow} onPress={() => openUrl(`tel:${t.phone.replace(/[^0-9+]/g, '')}`)}>
            <Ionicons name="call" size={19} color="#cbd5e1" />
            <Text style={styles.contactText}>{t.phone}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => openUrl(`mailto:${t.email}`)}>
            <Ionicons name="mail" size={19} color="#cbd5e1" />
            <Text style={styles.contactText}>{t.email}</Text>
          </TouchableOpacity>
          <View style={styles.contactRow}>
            <Ionicons name="time" size={19} color="#cbd5e1" />
            <Text style={styles.contactText}>{t.schedule}</Text>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>{t.writeUs}</Text>
          <TextInput
            style={styles.footerInput}
            placeholder={t.namePlaceholder}
            placeholderTextColor="#94a3b8"
            value={contactForm.name}
            onChangeText={(name) => setContactForm((current) => ({ ...current, name }))}
          />
          <TextInput
            style={styles.footerInput}
            placeholder={t.emailPlaceholder}
            placeholderTextColor="#94a3b8"
            value={contactForm.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(email) => setContactForm((current) => ({ ...current, email }))}
          />
          <TextInput
            style={[styles.footerInput, styles.footerMessage]}
            placeholder={t.messagePlaceholder}
            placeholderTextColor="#94a3b8"
            value={contactForm.message}
            multiline
            onChangeText={(message) => setContactForm((current) => ({ ...current, message }))}
          />
          <TouchableOpacity style={styles.footerSendButton} onPress={sendContactMessage}>
            <Ionicons name="send" size={18} color="#ffffff" />
            <Text style={styles.footerSendText}>{t.sendMessage}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerDivider} />
        <Text style={styles.footerSmall}>{t.copyright}</Text>
        <Text style={styles.footerSmall}>{t.credit}</Text>
      </View>
    </ScrollView>
  );
}

const light = {
  background: '#f8fafc',
  card: '#ffffff',
  soft: '#f1f5f9',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  footer: '#0f2a44',
};

const dark = {
  background: '#020617',
  card: '#0f172a',
  soft: '#1e293b',
  text: '#f8fafc',
  muted: '#cbd5e1',
  border: '#1e293b',
  footer: '#0b1f33',
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingBottom: 30 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 5, lineHeight: 20 },
  card: { borderRadius: 18, borderWidth: 1, padding: 15, marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: '900', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '900', marginBottom: 3 },
  settingText: { lineHeight: 19 },
  languageRow: { flexDirection: 'row', gap: 8 },
  languageButton: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  languageText: { fontWeight: '900', fontSize: 12 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  actionText: { flex: 1, fontWeight: '800' },
  businessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0891b2',
    paddingVertical: 14,
    borderRadius: 14,
  },
  businessButtonText: { color: '#ffffff', fontWeight: '900' },
  footerBlock: { marginTop: 4, borderRadius: 22, borderWidth: 1, padding: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandLogo: { width: 52, height: 52, borderRadius: 12 },
  brandTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  brandSubtitle: { color: '#f59e0b', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  brandDescription: { color: '#cbd5e1', lineHeight: 22, marginTop: 14 },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  footerSection: { marginTop: 22 },
  footerTitle: { color: '#f59e0b', fontSize: 17, fontWeight: '900', marginBottom: 10 },
  footerLink: { paddingVertical: 6 },
  footerLinkText: { color: '#cbd5e1', fontSize: 15, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  contactText: { color: '#cbd5e1', flex: 1, lineHeight: 20, fontWeight: '700' },
  footerInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 13,
    minHeight: 46,
    marginBottom: 10,
  },
  footerMessage: { minHeight: 92, textAlignVertical: 'top', paddingTop: 12 },
  footerSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 18,
  },
  footerSendText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  footerDivider: { height: 1, backgroundColor: '#334155', marginVertical: 18 },
  footerSmall: { color: '#94a3b8', fontSize: 12, lineHeight: 18 },
});
