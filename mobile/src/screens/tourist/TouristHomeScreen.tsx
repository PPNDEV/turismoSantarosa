import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '../../context/PreferencesContext';
import { useTourismContent } from '../../context/TourismContentContext';
import { moduleConfigs, moduleOrder } from '../../services/tourismContent';

const HERO_AUTO_ADVANCE_MS = 5200;

const lightTheme = {
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
};

const darkTheme = {
  background: '#020617',
  card: '#0f172a',
  text: '#f8fafc',
  muted: '#cbd5e1',
  border: '#1e293b',
};

export default function TouristHomeScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const { items, byType, loading, fromCache, heroSlides } = useTourismContent();
  const { darkMode } = usePreferences();
  const [currentSlide, setCurrentSlide] = useState(0);
  const featured = useMemo(() => items.slice(0, 5), [items]);
  const activeSlide = heroSlides[currentSlide % heroSlides.length] || heroSlides[0];
  const theme = darkMode ? darkTheme : lightTheme;
  const compactHero = width < 390 || height < 760;
  const heroHeight = Math.max(compactHero ? 300 : 340, Math.min(height * 0.43, 380));
  const titleFontSize = compactHero ? 28 : 32;
  const titleLineHeight = compactHero ? 33 : 37;

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;

    const timer = setTimeout(() => {
      setCurrentSlide((current) => (current + 1) % heroSlides.length);
    }, HERO_AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
  }, [currentSlide, heroSlides.length]);

  const previousSlide = () => {
    setCurrentSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((current) => (current + 1) % heroSlides.length);
  };

  const openSlideAction = () => {
    const target = String(activeSlide?.ctaTo || '').toLowerCase();
    if (target.includes('map') || target.includes('mapa')) {
      navigation.navigate('Mapa');
      return;
    }

    navigation.navigate('Catálogo');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <ImageBackground
        source={{ uri: activeSlide.bg }}
        style={[styles.hero, { minHeight: heroHeight }]}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroShade}>
          <View style={styles.heroTop}>
            <Text style={styles.kicker}>Visit Santa Rosa</Text>
            <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Ajustes')}>
              <Ionicons name="settings-outline" size={17} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTag} numberOfLines={1}>{activeSlide.tag}</Text>
          <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleLineHeight }]} numberOfLines={3}>
            {activeSlide.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={compactHero ? 2 : 3}>{activeSlide.sub}</Text>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.primaryAction} onPress={openSlideAction}>
              <Ionicons name="search-outline" size={18} color="#ffffff" />
              <Text style={styles.primaryActionText} numberOfLines={1}>{activeSlide.cta || 'Buscar lugares'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Mapa')}>
              <Ionicons name="map-outline" size={18} color="#ffffff" />
              <Text style={styles.secondaryActionText}>Ver mapa</Text>
            </TouchableOpacity>
          </View>

          {heroSlides.length > 1 && (
            <>
              <TouchableOpacity style={[styles.slideArrow, styles.slideArrowLeft]} onPress={previousSlide}>
                <Ionicons name="chevron-back" size={18} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.slideArrow, styles.slideArrowRight]} onPress={nextSlide}>
                <Ionicons name="chevron-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.heroDots}>
                {heroSlides.map((slide, index) => (
                  <TouchableOpacity
                    key={slide.id}
                    style={[styles.heroDot, index === currentSlide && styles.heroDotActive]}
                    onPress={() => setCurrentSlide(index)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ImageBackground>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#0891b2" />
          <Text style={styles.loadingText}>Sincronizando contenido turistico...</Text>
        </View>
      )}

      {fromCache && (
        <View style={styles.cacheBanner}>
          <Ionicons name="cloud-offline-outline" size={18} color="#0f766e" />
          <Text style={styles.cacheText}>Mostrando contenido guardado para uso sin conexion.</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>{items.length}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Registros</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>6</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Modulos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>Offline</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Favoritos</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Modulos turisticos</Text>
        <Text style={[styles.sectionHint, { color: theme.muted }]}>Contenido publico alineado con la web</Text>
      </View>

      <View style={styles.modulesGrid}>
        {moduleOrder.map((key) => {
          const config = moduleConfigs[key];
          const count = byType[key]?.length ?? 0;

          return (
            <TouchableOpacity
              key={key}
              style={[styles.moduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('Catálogo', { initialType: key })}
            >
              <View style={[styles.moduleIcon, { backgroundColor: `${config.color}1A` }]}>
                <Ionicons name={config.icon as any} size={24} color={config.color} />
              </View>
              <Text style={[styles.moduleTitle, { color: theme.text }]}>{config.pluralLabel}</Text>
              <Text style={[styles.moduleDescription, { color: theme.muted }]}>{config.description}</Text>
              <Text style={styles.moduleCount}>{count} disponibles</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recomendados</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Catálogo')}>
          <Text style={styles.link}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      {featured.map((item) => (
        <TouchableOpacity
          key={`${item.type}-${item.id}`}
          style={[styles.featuredCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('PlaceDetailsScreen', { type: item.type, id: item.id })}
        >
          <ImageBackground source={{ uri: item.image }} style={styles.featuredImage} imageStyle={styles.featuredImageRadius}>
            <View style={[styles.featuredBadge, { backgroundColor: moduleConfigs[item.type].color }]}>
              <Text style={styles.featuredBadgeText}>{moduleConfigs[item.type].label}</Text>
            </View>
          </ImageBackground>
          <View style={styles.featuredBody}>
            <Text style={[styles.featuredTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
            <Text style={[styles.featuredDescription, { color: theme.muted }]} numberOfLines={2}>{item.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 28 },
  hero: { marginBottom: 18 },
  heroImage: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroShade: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 42,
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  kicker: { color: '#bae6fd', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  heroTag: { color: '#bae6fd', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
  },
  title: { color: '#ffffff', fontWeight: '900', marginBottom: 10 },
  subtitle: { color: '#e0f2fe', fontSize: 15, lineHeight: 21, marginBottom: 18 },
  heroActions: { flexDirection: 'row', gap: 10 },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0891b2',
    paddingVertical: 13,
    borderRadius: 14,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
  },
  primaryActionText: { color: '#ffffff', fontWeight: '900' },
  secondaryActionText: { color: '#ffffff', fontWeight: '900' },
  slideArrow: {
    position: 'absolute',
    top: '53%',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.36)',
  },
  slideArrowLeft: { left: 6 },
  slideArrowRight: { right: 6 },
  heroDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  heroDotActive: { width: 24, backgroundColor: '#ffffff' },
  loadingRow: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#475569', fontWeight: '700' },
  cacheBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cacheText: { color: '#0f766e', flex: 1, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  statLabel: { color: '#64748b', marginTop: 4, fontSize: 12, fontWeight: '700' },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#0f172a', fontSize: 22, fontWeight: '900' },
  sectionHint: { color: '#64748b', fontSize: 12, flex: 1, textAlign: 'right' },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 22 },
  moduleCard: {
    width: '48.5%',
    minHeight: 168,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  moduleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  moduleTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  moduleDescription: { color: '#64748b', fontSize: 12, lineHeight: 17, flex: 1 },
  moduleCount: { color: '#0891b2', fontWeight: '900', marginTop: 10, fontSize: 12 },
  link: { color: '#0891b2', fontWeight: '900' },
  featuredCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featuredImage: { height: 150, justifyContent: 'flex-start', alignItems: 'flex-start', padding: 12 },
  featuredImageRadius: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  featuredBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  featuredBadgeText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },
  featuredBody: { padding: 14 },
  featuredTitle: { color: '#0f172a', fontWeight: '900', fontSize: 18, marginBottom: 4 },
  featuredSubtitle: { color: '#0891b2', fontWeight: '800', marginBottom: 8 },
  featuredDescription: { color: '#475569', lineHeight: 20 },
});
