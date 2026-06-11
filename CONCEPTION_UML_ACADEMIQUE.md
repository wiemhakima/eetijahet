# 📐 Conception UML Académique Globale - Projet Etijahat

## Informations du Document
- **Projet**: Système de Routage Intelligent Etijahat
- **Type**: Conception UML Académique Complète
- **Version**: 1.0
- **Date**: 15 Mars 2026
- **Auteur**: Architecture Système

---

## 📑 Table des Matières
1. [Diagramme de Cas d'Utilisation](#1-diagramme-de-cas-dutilisation)
2. [Diagramme de Classes](#2-diagramme-de-classes)
3. [Diagramme de Séquence](#3-diagrammes-de-séquence)
4. [Diagramme d'Activité](#4-diagrammes-dactivité)
5. [Diagramme de Composants](#5-diagramme-de-composants)
6. [Diagramme de Déploiement](#6-diagramme-de-déploiement)
7. [Diagramme d'États-Transitions](#7-diagramme-détats-transitions)
8. [Diagramme de Packages](#8-diagramme-de-packages)
9. [Modèle Entité-Association](#9-modèle-entité-association)

---

## 1. Diagramme de Cas d'Utilisation

### 1.1 Vue Globale du Système

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SYSTÈME ETIJAHAT ROUTING                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  Gestion des Utilisateurs                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │
│  │  │  S'inscrire  │  │ Se connecter │  │Gérer profil │     │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  Gestion des API Keys                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │
│  │  │ Créer API Key│  │Révoquer Key  │  │Consulter logs│     │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Services de Prédiction ML                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │
│  │  │Prédire ETA   │  │Prédire       │  │Prédiction    │     │    │
│  │  │              │  │Distance      │  │Combinée      │     │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Optimisation de Routes                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │
│  │  │Calculer route│  │Route multi-  │  │Visualiser    │     │    │
│  │  │optimale      │  │arrêts        │  │sur carte     │     │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Administration Système                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │
│  │  │Gérer         │  │Consulter     │  │Construire    │     │    │
│  │  │utilisateurs  │  │statistiques  │  │graphe routier│     │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘

Acteurs:
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│Utilisateur│        │Développeur│        │   Admin  │         │  Système │
│  Final   │         │   API    │         │          │         │   ML     │
└──────────┘         └──────────┘         └──────────┘         └──────────┘
     │                    │                     │                    │
     │                    │                     │                    │
     ├─ S'inscrire        │                     │                    │
     ├─ Se connecter      │                     │                    │
     ├─ Demander route    │                     │                    │
     ├─ Visualiser carte  │                     │                    │
     │                    │                     │                    │
     │                    ├─ Créer API Key      │                    │
     │                    ├─ Appeler API        │                    │
     │                    ├─ Consulter logs     │                    │
     │                    ├─ Gérer crédits      │                    │
     │                    │                     │                    │
     │                    │                     ├─ Gérer users       │
     │                    │                     ├─ Voir stats        │
     │                    │                     ├─ Construire graphe │
     │                    │                     │                    │
     │                    │                     │                    ├─ Entraîner modèles
     │                    │                     │                    ├─ Prédire ETA
     │                    │                     │                    ├─ Optimiser routes
```

### 1.2 Cas d'Utilisation Détaillés

#### CU-01: Optimiser une Route
**Acteur Principal**: Développeur API / Utilisateur Final  
**Préconditions**: Utilisateur authentifié, API Key valide  
**Scénario Principal**:
1. L'utilisateur fournit coordonnées pickup/dropoff
2. Le système valide les coordonnées
3. Le système charge le graphe routier
4. Le système prédit les poids des arêtes via ML
5. Le système exécute l'algorithme A*
6. Le système retourne la route optimale

**Extensions**:
- 3a. Graphe non disponible → Utiliser prédiction directe
- 4a. Modèle ML indisponible → Utiliser poids statiques
- 6a. Aucun chemin trouvé → Retourner erreur

#### CU-02: Gérer les API Keys
**Acteur Principal**: Développeur API  
**Préconditions**: Compte utilisateur créé  
**Scénario Principal**:
1. L'utilisateur demande création d'API Key
2. Le système génère une clé unique
3. Le système associe permissions
4. Le système stocke la clé
5. Le système retourne la clé à l'utilisateur

---

## 2. Diagramme de Classes

### 2.1 Couche Domaine (Domain Layer)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOMAIN MODELS                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│           User                   │
├──────────────────────────────────┤
│ - _id: ObjectId                  │
│ - firstName: String              │
│ - lastName: String               │
│ - email: String                  │
│ - password: String               │
│ - company: String                │
│ - avatar: String                 │
│ - role: Enum                     │
│ - tier: Enum                     │
│ - activeApiSettings: ObjectId    │
│ - createdAt: Date                │
│ - updatedAt: Date                │
├──────────────────────────────────┤
│ + comparePassword(pwd): Boolean  │
│ + hashPassword(): void           │
│ + toJSON(): Object               │
└──────────────────────────────────┘
           │
           │ 1
           │
           │ *
           ▼
┌──────────────────────────────────┐
│          ApiKey                  │
├──────────────────────────────────┤
│ - _id: ObjectId                  │
│ - name: String                   │
│ - key: String                    │
│ - userId: ObjectId               │
│ - status: Enum                   │
│ - permissions: Array<String>     │
│ - created: Date                  │
│ - expires: Date                  │
│ - lastUsed: Date                 │
├──────────────────────────────────┤
│ + generateApiKey(): String       │
│ + isExpired(): Boolean           │
│ + updateLastUsed(): void         │
│ + hasPermission(perm): Boolean   │
└──────────────────────────────────┘
           │
           │ 1
           │
           │ *
           ▼
┌──────────────────────────────────┐
│        RequestLog                │
├──────────────────────────────────┤
│ - _id: ObjectId                  │
│ - userId: ObjectId               │
│ - apiKeyId: ObjectId             │
│ - endpointRoute: String          │
│ - endpointName: String           │
│ - requestStatus: Number          │
│ - responseMessage: String        │
│ - requestDate: Date              │
│ - creditsUsed: Number            │
│ - method: String                 │
│ - requestBody: Mixed             │
│ - responseTime: Number           │
│ - ipAddress: String              │
│ - isSuccess: Boolean             │
├──────────────────────────────────┤
│ + logRequest(): void             │
│ + getStatistics(): Object        │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│         RoadGraph                │
├──────────────────────────────────┤
│ - _id: ObjectId                  │
│ - version: String                │
│ - createdAt: Date                │
│ - region: String                 │
│ - nodes: Array<Node>             │
│ - edges: Array<Edge>             │
│ - statistics: Object             │
├──────────────────────────────────┤
│ + addNode(node): void            │
│ + addEdge(edge): void            │
│ + getNode(id): Node              │
│ + getNeighbors(id): Array<Node>  │
│ + calculateStats(): Object       │
└──────────────────────────────────┘
           │
           │ contains
           │
           ├──────────────┬──────────────┐
           │              │              │
           ▼              ▼              │
┌──────────────────┐  ┌──────────────────┐
│      Node        │  │      Edge        │
├──────────────────┤  ├──────────────────┤
│ - id: String     │  │ - source: String │
│ - lat: Number    │  │ - target: String │
│ - lon: Number    │  │ - distanceMeters │
│ - type: String   │  │ - avgSpeedKmh    │
│ - visitCount: N  │  │ - travelCount    │
├──────────────────┤  │ - roadType       │
│ + getCoords()    │  ├──────────────────┤
│ + distance(n)    │  │ + getWeight()    │
└──────────────────┘  │ + getTravelTime()│
                      └──────────────────┘

┌──────────────────────────────────┐
│         RouteHistory             │
├──────────────────────────────────┤
│ - _id: ObjectId                  │
│ - orderId: ObjectId              │
│ - driverId: ObjectId             │
│ - recommendedRoute: Object       │
│ - actualRoute: Object            │
│ - deviation: Object              │
│ - timestamp: Date                │
├──────────────────────────────────┤
│ + calculateDeviation(): Object   │
│ + getAdherenceRate(): Number     │
└──────────────────────────────────┘
```

### 2.2 Couche Service (Service Layer)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│      AuthService                 │
├──────────────────────────────────┤
│ - userRepository: UserRepository │
│ - jwtSecret: String              │
├──────────────────────────────────┤
│ + register(data): User           │
│ + login(email, pwd): Token       │
│ + verifyToken(token): User       │
│ + refreshToken(token): Token     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      ApiKeyService               │
├──────────────────────────────────┤
│ - apiKeyRepository: Repository   │
├──────────────────────────────────┤
│ + createApiKey(userId): ApiKey   │
│ + validateApiKey(key): Boolean   │
│ + revokeApiKey(keyId): void      │
│ + getApiKeys(userId): Array      │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      CombinedService             │
├──────────────────────────────────┤
│ - modelServerUrl: String         │
│ - cache: LRUCache                │
├──────────────────────────────────┤
│ + predictCombined(data): Object  │
│ + predictDistance(coords): Number│
│ + predictETA(coords, time): Num  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      RoutingService              │
├──────────────────────────────────┤
│ - routeOptimizer: RouteOptimizer │
│ - graphLoader: GraphLoader       │
│ - cache: RedisCache              │
├──────────────────────────────────┤
│ + optimizeRoute(data): Route     │
│ + multiStopRoute(stops): Route   │
│ + getAlternatives(route): Array  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      CreditService               │
├──────────────────────────────────┤
│ - transactionRepo: Repository    │
├──────────────────────────────────┤
│ + deductCredits(userId, amt): Tx │
│ + getBalance(userId): Number     │
│ + getHistory(userId): Array      │
└──────────────────────────────────┘
```

### 2.3 Couche ML/AI (Machine Learning Layer)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ML/AI LAYER (Python)                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│      GraphBuilder                │
├──────────────────────────────────┤
│ - mongodb_uri: String            │
│ - db: MongoClient                │
│ - graph: DiGraph                 │
│ - nodes: List                    │
│ - edges: List                    │
├──────────────────────────────────┤
│ + load_historical_traces(limit)  │
│ + extract_road_segments(traces)  │
│ + build_graph(limit): DiGraph    │
│ + save_graph(filepath): void     │
│ + load_graph(filepath): DiGraph  │
│ - _generate_synthetic_trace()    │
│ - _build_edges(traces, nodes)    │
│ - _find_nearest_node(point)      │
│ - _haversine_distance()          │
│ - _classify_road_type(speed)     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      RouteOptimizer              │
├──────────────────────────────────┤
│ - graph: DiGraph                 │
│ - nodes: List                    │
│ - edges: List                    │
│ - model: CombinedModel           │
├──────────────────────────────────┤
│ + find_nearest_node(lat, lon)    │
│ + predict_edge_weight(edge, time)│
│ + calculate_route(pickup, drop)  │
│ + astar_route(start, goal, time) │
│ + heuristic(node, goal): Number  │
│ - haversine_distance()           │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      CombinedModel               │
├──────────────────────────────────┤
│ - distance_model: XGBoost        │
│ - eta_model: XGBoost             │
│ - cache: LRUCache                │
├──────────────────────────────────┤
│ + predict_eta_distance(data): Obj│
│ + predict_distance(coords): Num  │
│ + predict_eta(coords, time): Num │
│ - _extract_features(data): Array │
│ - _convert_timezone(time): Date  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      DistanceModel               │
├──────────────────────────────────┤
│ - model: XGBRegressor            │
│ - features: List                 │
├──────────────────────────────────┤
│ + predict(coords): Number        │
│ + train(X, y): void              │
│ + evaluate(X_test, y_test): Obj  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      ETAModel                    │
├──────────────────────────────────┤
│ - model: XGBRegressor            │
│ - features: List                 │
├──────────────────────────────────┤
│ + predict(coords, time): Number  │
│ + train(X, y): void              │
│ + evaluate(X_test, y_test): Obj  │
└──────────────────────────────────┘
```

---

## 3. Diagrammes de Séquence

### 3.1 Séquence: Optimisation de Route Complète

```
Utilisateur  Frontend   API Gateway  RoutingService  RouteOptimizer  GraphLoader  CombinedModel  DistanceModel  ETAModel
    │           │            │              │               │              │              │              │           │
    │ Demande   │            │              │               │              │              │              │           │
    │  route    │            │              │               │              │              │              │           │
    ├──────────►│            │              │               │              │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │ POST /api/v1/routing/optimize            │              │              │              │           │
    │           ├───────────►│              │               │              │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │ Valider      │               │              │              │              │           │
    │           │            │ API Key      │               │              │              │              │           │
    │           │            ├──────────┐   │               │              │              │              │           │
    │           │            │          │   │               │              │              │              │           │
    │           │            │◄─────────┘   │               │              │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │ optimizeRoute(data)          │              │              │              │           │
    │           │            ├─────────────►│               │              │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │ calculate_route(pickup, dropoff, time)     │              │           │
    │           │            │              ├──────────────►│              │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │ load_graph() │              │              │           │
    │           │            │              │               ├─────────────►│              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │ graph        │              │              │           │
    │           │            │              │               │◄─────────────┤              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │ find_nearest_node(pickup)   │              │           │
    │           │            │              │               ├──────────┐   │              │              │           │
    │           │            │              │               │          │   │              │              │           │
    │           │            │              │               │◄─────────┘   │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │ find_nearest_node(dropoff)  │              │           │
    │           │            │              │               ├──────────┐   │              │              │           │
    │           │            │              │               │          │   │              │              │           │
    │           │            │              │               │◄─────────┘   │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │ Pour chaque arête du chemin potentiel:     │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │ predict_edge_weight(edge, time)            │           │
    │           │            │              │               ├─────────────────────────────►│              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │              │              │ predict(coords)          │
    │           │            │              │               │              │              ├─────────────►│           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │              │              │ distance     │           │
    │           │            │              │               │              │              │◄─────────────┤           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │              │              │ predict(coords, time)    │
    │           │            │              │               │              │              ├─────────────────────────►│
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │              │              │ eta_minutes  │           │
    │           │            │              │               │              │              │◄─────────────────────────┤
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │ predicted_time              │              │           │
    │           │            │              │               │◄─────────────────────────────┤              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │               │ astar_route(start, goal, time)             │           │
    │           │            │              │               ├──────────┐   │              │              │           │
    │           │            │              │               │          │   │              │              │           │
    │           │            │              │               │ Exécute  │   │              │              │           │
    │           │            │              │               │ A* avec  │   │              │              │           │
    │           │            │              │               │ poids ML │   │              │              │           │
    │           │            │              │               │          │   │              │              │           │
    │           │            │              │               │◄─────────┘   │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │              │ route optimale│              │              │              │           │
    │           │            │              │◄──────────────┤              │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │            │ route        │               │              │              │              │           │
    │           │            │◄─────────────┤               │              │              │              │           │
    │           │            │              │               │              │              │              │           │
    │           │ Response   │              │               │              │              │              │           │
    │           │◄───────────┤              │               │              │              │              │           │
    │           │            │              │               │              │              │              │           │
    │ Affiche   │            │              │               │              │              │              │           │
    │  route    │            │              │               │              │              │              │           │
    │◄──────────┤            │              │               │              │              │              │           │
    │           │            │              │               │              │              │              │           │
```

### 3.2 Séquence: Authentification et Création d'API Key

```
Utilisateur  Frontend   AuthService  UserRepository  ApiKeyService  ApiKeyRepository  Database
    │           │            │              │               │              │              │
    │ Register  │            │              │               │              │              │
    ├──────────►│            │              │               │              │              │
    │           │            │              │               │              │              │
    │           │ POST /api/v1/auth/register│               │              │              │
    │           ├───────────►│              │               │              │              │
    │           │            │              │               │              │              │
    │           │            │ createUser(data)             │              │              │
    │           │            ├─────────────►│               │              │              │
    │           │            │              │               │              │              │
    │           │            │              │ hashPassword()│              │              │
    │           │            │              ├──────────┐    │              │              │
    │           │            │              │          │    │              │              │
    │           │            │              │◄─────────┘    │              │              │
    │           │            │              │               │              │              │
    │           │            │              │ save(user)    │              │              │
    │           │            │              ├──────────────────────────────►│              │
    │           │            │              │               │              │              │
    │           │            │              │               │              │ INSERT       │
    │           │            │              │               │              ├─────────────►│
    │           │            │              │               │              │              │
    │           │            │              │               │              │ user_id      │
    │           │            │              │               │              │◄─────────────┤
    │           │            │              │               │              │              │
    │           │            │              │ user          │              │              │
    │           │            │              │◄──────────────────────────────┤              │
    │           │            │              │               │              │              │
    │           │            │ user         │               │              │              │
    │           │            │◄─────────────┤               │              │              │
    │           │            │              │               │              │              │
    │           │ JWT Token  │              │               │              │              │
    │           │◄───────────┤              │               │              │              │
    │           │            │              │               │              │              │
    │ Token     │            │              │               │              │              │
    │◄──────────┤            │              │               │              │              │
    │           │            │              │               │              │              │
    │           │            │              │               │              │              │
    │ Create    │            │              │               │              │              │
    │ API Key   │            │              │               │              │              │
    ├──────────►│            │              │               │              │              │
    │           │            │              │               │              │              │
    │           │ POST /api/v1/apikeys      │               │              │              │
    │           ├───────────────────────────────────────────►│              │              │
    │           │            │              │               │              │              │
    │           │            │              │               │ generateApiKey()            │
    │           │            │              │               ├──────────┐   │              │
    │           │            │              │               │          │   │              │
    │           │            │              │               │◄─────────┘   │              │
    │           │            │              │               │              │              │
    │           │            │              │               │ save(apiKey) │              │
    │           │            │              │               ├─────────────►│              │
    │           │            │              │               │              │              │
    │           │            │              │               │              │ INSERT       │
    │           │            │              │               │              ├─────────────►│
    │           │            │              │               │              │              │
    │           │            │              │               │              │ apikey_id    │
    │           │            │              │               │              │◄─────────────┤
    │           │            │              │               │              │              │
    │           │            │              │               │ apiKey       │              │
    │           │            │              │               │◄─────────────┤              │
    │           │            │              │               │              │              │
    │           │ API Key    │              │               │              │              │
    │           │◄───────────────────────────────────────────┤              │              │
    │           │            │              │               │              │              │
    │ API Key   │            │              │               │              │              │
    │◄──────────┤            │              │               │              │              │
    │           │            │              │               │              │              │
```

---

## 4. Diagrammes d'Activité

### 4.1 Activité: Construction du Graphe Routier

```
                    ┌─────────────────┐
                    │     DÉBUT       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Charger ordres  │
                    │ historiques     │
                    │ depuis MongoDB  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Traces GPS      │
                    │ disponibles?    │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                 OUI│                 │NON
                    │                 │
                    ▼                 ▼
        ┌─────────────────┐  ┌─────────────────┐
        │ Extraire traces │  │ Générer traces  │
        │ GPS réelles     │  │ synthétiques    │
        └────────┬────────┘  └────────┬────────┘
                 │                     │
                 └──────────┬──────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Clustering DBSCAN│
                   │ des points GPS  │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Créer nœuds     │
                   │ (centroïdes)    │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Connecter nœuds │
                   │ séquentiels     │
                   │ → Créer arêtes  │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Calculer        │
                   │ attributs arêtes│
                   │ (distance, vit.)│
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Calculer        │
                   │ statistiques    │
                   │ du graphe       │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Sauvegarder     │
                   │ graphe          │
                   │ (JSON + Pickle) │
                   └────────┬────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │      FIN        │
                    └─────────────────┘
```

### 4.2 Activité: Algorithme A* pour Optimisation de Route

```
                    ┌─────────────────┐
                    │     DÉBUT       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Charger graphe  │
                    │ routier         │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Trouver nœud    │
                    │ pickup le plus  │
                    │ proche          │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Trouver nœud    │
                    │ dropoff le plus │
                    │ proche          │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Initialiser:    │
                    │ - open_set      │
                    │ - g_score       │
                    │ - f_score       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ open_set vide?  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                 NON│                 │OUI
                    │                 │
                    ▼                 ▼
        ┌─────────────────┐  ┌─────────────────┐
        │ Extraire nœud   │  │ Aucun chemin    │
        │ avec f_score    │  │ trouvé          │
        │ minimal         │  │ → Erreur        │
        └────────┬────────┘  └────────┬────────┘
                 │                     │
                 ▼                     │
        ┌─────────────────┐            │
        │ Nœud = goal?    │            │
        └────────┬────────┘            │
                 │                     │
        ┌────────┴────────┐            │
        │                 │            │
     OUI│                 │NON         │
        │                 │            │
        ▼                 ▼            │
┌─────────────┐  ┌─────────────────┐  │
│Reconstruire │  │ Pour chaque     │  │
│ chemin      │  │ voisin du nœud  │  │
│ optimal     │  └────────┬────────┘  │
└──────┬──────┘           │            │
       │                  ▼            │
       │         ┌─────────────────┐   │
       │         │ Prédire poids   │   │
       │         │ arête via ML    │   │
       │         └────────┬────────┘   │
       │                  │            │
       │                  ▼            │
       │         ┌─────────────────┐   │
       │         │ Calculer        │   │
       │         │ tentative_g     │   │
       │         └────────┬────────┘   │
       │                  │            │
       │                  ▼            │
       │         ┌─────────────────┐   │
       │         │ tentative_g <   │   │
       │         │ g_score actuel? │   │
       │         └────────┬────────┘   │
       │                  │            │
       │         ┌────────┴────────┐   │
       │         │                 │   │
       │      OUI│                 │NON│
       │         │                 │   │
       │         ▼                 │   │
       │  ┌─────────────────┐     │   │
       │  │ Mettre à jour:  │     │   │
       │  │ - came_from     │     │   │
       │  │ - g_score       │     │   │
       │  │ - f_score       │     │   │
       │  │ Ajouter à       │     │   │
       │  │ open_set        │     │   │
       │  └────────┬────────┘     │   │
       │           │              │   │
       │           └──────┬───────┘   │
       │                  │            │
       │                  └────────────┘
       │                  │
       │                  │ (Boucle)
       │                  │
       ▼                  ▼
┌─────────────────┐
│ Convertir nœuds │
│ en coordonnées  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calculer temps  │
│ et distance     │
│ totaux          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retourner route │
│ optimale        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      FIN        │
└─────────────────┘
```

---

## 5. Diagramme de Composants

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE EN COMPOSANTS                        │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                         FRONTEND TIER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    React Application                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Routing    │  │   Dashboard  │  │   API Keys   │         │ │
│  │  │   Engine     │  │  Component   │  │  Management  │         │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │ │
│  │         │                  │                  │                 │ │
│  │         └──────────────────┴──────────────────┘                 │ │
│  │                            │                                    │ │
│  │  ┌─────────────────────────▼──────────────────────────┐        │ │
│  │  │           Services Layer (TypeScript)              │        │ │
│  │  │  - routingService.ts                               │        │ │
│  │  │  - authService.js                                  │        │ │
│  │  │  - searchService.ts                                │        │ │
│  │  └────────────────────────────────────────────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ HTTPS/REST
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                         API GATEWAY TIER                              │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Server                            │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │                  Middleware Stack                        │  │ │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐   │  │ │
│  │  │  │  CORS  │ │  Auth  │ │ Logger │ │ Rate Limiter   │   │  │ │
│  │  │  └────────┘ └────────┘ └────────┘ └────────────────┘   │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │                    Route Handlers                        │  │ │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │  │ │
│  │  │  │   Auth     │ │  Routing   │ │    Combined        │  │  │ │
│  │  │  │  Routes    │ │   Routes   │ │     Routes         │  │  │ │
│  │  │  └────────────┘ └────────────┘ └────────────────────┘  │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                         SERVICE TIER                                  │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Business Services (Node.js)                  │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │ │
│  │  │   Auth     │ │  Routing   │ │  Combined  │ │   Credit   │  │ │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service   │  │ │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                 │ │
│  │  │  Geocoder  │ │   Logger   │ │  Notif.    │                 │ │
│  │  │  Service   │ │  Service   │ │  Service   │                 │ │
│  │  └────────────┘ └────────────┘ └────────────┘                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ HTTP/gRPC
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                         ML/AI TIER (Python)                           │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Model Server (Flask)                         │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │                  ML Components                             │ │ │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │ │
│  │  │  │   Distance   │ │     ETA      │ │  Combined Model  │  │ │ │
│  │  │  │    Model     │ │    Model     │ │                  │  │ │ │
│  │  │  │  (XGBoost)   │ │  (XGBoost)   │ │                  │  │ │ │
│  │  │  └──────────────┘ └──────────────┘ └──────────────────┘  │ │ │
│  │  │                                                            │ │ │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │ │
│  │  │  │    Graph     │ │    Route     │ │   A* Algorithm   │  │ │ │
│  │  │  │   Builder    │ │  Optimizer   │ │                  │  │ │ │
│  │  │  │  (NetworkX)  │ │  (NetworkX)  │ │                  │  │ │ │
│  │  │  └──────────────┘ └──────────────┘ └──────────────────┘  │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  │                                                                 │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │                  Cache Layer (LRU)                         │ │ │
│  │  │  - Prediction Cache (1024 entries)                        │ │ │
│  │  │  - Graph Cache (in-memory)                                │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                         DATA TIER                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    MongoDB Cluster                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Primary    │  │  Secondary   │  │  Secondary   │         │ │
│  │  │   Replica    │  │   Replica    │  │   Replica    │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                 │ │
│  │  Collections:                                                   │ │
│  │  • users  • api-keys  • request-logs  • orders                 │ │
│  │  • road_graphs  • route_history  • notifications               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Redis Cache                                  │ │
│  │  - Session Storage                                              │ │
│  │  - API Response Cache (TTL: 10 min)                            │ │
│  │  - Rate Limiting Counters                                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    File Storage                                 │ │
│  │  - ML Models (.pkl files)                                       │ │
│  │  - Road Graph Data (JSON/pickle)                                │ │
│  │  - Training Datasets                                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 6. Diagramme de Déploiement

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE DE DÉPLOIEMENT                     │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                         CLOUD PROVIDER (AWS/Azure/GCP)                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Load Balancer (NGINX)                        │ │
│  │  <<device>>                                                     │ │
│  │  - SSL Termination                                              │ │
│  │  - Rate Limiting                                                │ │
│  │  - Request Distribution                                         │ │
│  └────────────────────────┬────────────────────────────────────────┘ │
│                           │                                          │
│  ┌────────────────────────┴────────────────────────────────────────┐ │
│  │              Application Server Cluster                         │ │
│  │  <<execution environment: Docker>>                              │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Server 1   │  │   Server 2   │  │   Server 3   │         │ │
│  │  │  <<container>>│  │  <<container>>│  │  <<container>>│         │ │
│  │  │              │  │              │  │              │         │ │
│  │  │  Node.js     │  │  Node.js     │  │  Node.js     │         │ │
│  │  │  Express API │  │  Express API │  │  Express API │         │ │
│  │  │              │  │              │  │              │         │ │
│  │  │  Port: 3000  │  │  Port: 3000  │  │  Port: 3000  │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                           │                                          │
│  ┌────────────────────────┴────────────────────────────────────────┐ │
│  │              ML Service Cluster                                 │ │
│  │  <<execution environment: Docker>>                              │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐                            │ │
│  │  │  ML Server 1 │  │  ML Server 2 │                            │ │
│  │  │ <<container>> │  │ <<container>> │                            │ │
│  │  │              │  │              │                            │ │
│  │  │  Python 3.9+ │  │  Python 3.9+ │                            │ │
│  │  │  Flask/      │  │  Flask/      │                            │ │
│  │  │  FastAPI     │  │  FastAPI     │                            │ │
│  │  │              │  │              │                            │ │
│  │  │  Models:     │  │  Models:     │                            │ │
│  │  │  - Distance  │  │  - Distance  │                            │ │
│  │  │  - ETA       │  │  - ETA       │                            │ │
│  │  │  - Graph     │  │  - Graph     │                            │ │
│  │  │              │  │              │                            │ │
│  │  │  Port: 5000  │  │  Port: 5000  │                            │ │
│  │  └──────────────┘  └──────────────┘                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                           │                                          │
│  ┌────────────────────────┴────────────────────────────────────────┐ │
│  │              Database Cluster                                   │ │
│  │  <<database server>>                                            │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   MongoDB    │  │   MongoDB    │  │   MongoDB    │         │ │
│  │  │   Primary    │  │  Secondary   │  │  Secondary   │         │ │
│  │  │              │  │              │  │              │         │ │
│  │  │  Port: 27017 │  │  Port: 27017 │  │  Port: 27017 │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                  │ │
│  │  Replica Set: rs0                                               │ │
│  │  Data: users, api-keys, orders, road_graphs, logs              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              Cache Server                                       │ │
│  │  <<cache server>>                                               │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────┐          │ │
│  │  │              Redis Cluster                       │          │ │
│  │  │                                                   │          │ │
│  │  │  - Session Storage                                │          │ │
│  │  │  - API Response Cache                             │          │ │
│  │  │  - Rate Limiting Counters                         │          │ │
│  │  │                                                   │          │ │
│  │  │  Port: 6379                                       │          │ │
│  │  └──────────────────────────────────────────────────┘          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              Frontend Server                                    │ │
│  │  <<web server: NGINX>>                                          │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────┐          │ │
│  │  │         React Static Files                       │          │ │
│  │  │         - HTML, CSS, JS bundles                  │          │ │
│  │  │         - Assets (images, fonts)                 │          │ │
│  │  │                                                   │          │ │
│  │  │         Port: 80, 443                             │          │ │
│  │  └──────────────────────────────────────────────────┘          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              Monitoring & Logging                               │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │  Prometheus  │  │   Grafana    │  │  ELK Stack   │         │ │
│  │  │  (Metrics)   │  │ (Dashboard)  │  │  (Logs)      │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

Protocoles de Communication:
─────────────────────────────
• Client ↔ Load Balancer: HTTPS (443)
• Load Balancer ↔ App Servers: HTTP (3000)
• App Servers ↔ ML Servers: HTTP (5000)
• App Servers ↔ MongoDB: MongoDB Protocol (27017)
• App Servers ↔ Redis: Redis Protocol (6379)
• Monitoring: Prometheus Protocol (9090)
```

---

## 7. Diagramme d'États-Transitions

### 7.1 États d'une API Key

```
                    ┌─────────────────┐
                    │   [CRÉATION]    │
                    └────────┬────────┘
                             │
                             │ generateApiKey()
                             │
                             ▼
                    ┌─────────────────┐
                    │     ACTIVE      │◄──────────┐
                    └────────┬────────┘           │
                             │                    │
                    ┌────────┴────────┐           │
                    │                 │           │
                    │                 │           │
         updateLastUsed()      expires != null    │
                    │           && now > expires  │
                    │                 │           │
                    ▼                 ▼           │
            ┌─────────────┐   ┌─────────────┐    │
            │   ACTIVE    │   │   EXPIRED   │    │
            │ (lastUsed   │   │             │    │
            │  updated)   │   └─────────────┘    │
            └─────────────┘           │          │
                    │                 │          │
                    │                 │          │
                    │         renewApiKey()      │
                    │                 │          │
                    │                 └──────────┘
                    │
                    │ revokeApiKey()
                    │
                    ▼
            ┌─────────────┐
            │   REVOKED   │
            │  (terminal) │
            └─────────────┘
```

### 7.2 États d'une Requête de Routage

```
                    ┌─────────────────┐
                    │   [NOUVELLE]    │
                    │   REQUÊTE       │
                    └────────┬────────┘
                             │
                             │ POST /api/v1/routing/optimize
                             │
                             ▼
                    ┌─────────────────┐
                    │   VALIDATION    │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                 VALIDE          INVALIDE
                    │                 │
                    ▼                 ▼
        ┌─────────────────┐   ┌─────────────────┐
        │  AUTHENTIFICATION│   │     REJETÉE     │
        └────────┬────────┘   │   (400/401)     │
                 │             └─────────────────┘
        ┌────────┴────────┐
        │                 │
     SUCCÈS           ÉCHEC
        │                 │
        ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│ VÉRIF. CACHE    │ │   REJETÉE       │
└────────┬────────┘ │   (401)         │
         │          └─────────────────┘
┌────────┴────────┐
│                 │
│ HIT         MISS│
│                 │
▼                 ▼
┌──────────┐ ┌─────────────────┐
│ RETOUR   │ │  CHARGEMENT     │
│ CACHE    │ │  GRAPHE         │
└──────────┘ └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │  RECHERCHE      │
             │  NŒUDS PROCHES  │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │  PRÉDICTION     │
             │  POIDS ARÊTES   │
             │  (ML)           │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │  EXÉCUTION A*   │
             └────────┬────────┘
                      │
             ┌────────┴────────┐
             │                 │
         SUCCÈS           ÉCHEC
             │                 │
             ▼                 ▼
     ┌─────────────┐   ┌─────────────────┐
     │  FORMATAGE  │   │   ERREUR        │
     │  RÉPONSE    │   │   (404/500)     │
     └──────┬──────┘   └─────────────────┘
            │
            ▼
     ┌─────────────┐
     │  MISE EN    │
     │  CACHE      │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │  LOGGING    │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │  RÉPONSE    │
     │  ENVOYÉE    │
     │  (200)      │
     └─────────────┘
```

---

## 8. Diagramme de Packages

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STRUCTURE DES PACKAGES                            │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                         etijahat-routing                              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                        frontend                                 │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │    pages     │  │  components  │  │   services   │         │ │
│  │  │              │  │              │  │              │         │ │
│  │  │ - Home       │  │ - Button     │  │ - routing    │         │ │
│  │  │ - Routing    │  │ - Avatar     │  │ - auth       │         │ │
│  │  │ - Dashboard  │  │ - Skeleton   │  │ - search     │         │ │
│  │  │ - APIKeys    │  │ - Search     │  │              │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │    store     │  │    types     │  │   styles     │         │ │
│  │  │              │  │              │  │              │         │ │
│  │  │ - slices     │  │ - css.d.ts   │  │ - global     │         │ │
│  │  │ - hooks      │  │ - svg.d.ts   │  │ - variables  │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                         server                                  │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │                        src                               │  │ │
│  │  │                                                           │  │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │ │
│  │  │  │   api    │  │  models  │  │ services │  │  utils  │ │  │ │
│  │  │  │          │  │          │  │          │  │         │ │  │ │
│  │  │  │ - routes │  │ - User   │  │ - auth   │  │ - logger│ │  │ │
│  │  │  │ - ctrl   │  │ - ApiKey │  │ - routing│  │         │ │  │ │
│  │  │  │ - middle │  │ - Log    │  │ - combined│ │         │ │  │ │
│  │  │  │   ware   │  │ - Notif  │  │ - credit │  │         │ │  │ │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │  │ │
│  │  │                                                           │  │ │
│  │  │  ┌──────────┐  ┌──────────┐                             │  │ │
│  │  │  │  config  │  │ scripts  │                             │  │ │
│  │  │  │          │  │          │                             │  │ │
│  │  │  │ - index  │  │ - geocoder│                            │  │ │
│  │  │  │          │  │ - model   │                             │  │ │
│  │  │  │          │  │   server  │                             │  │ │
│  │  │  └──────────┘  └──────────┘                             │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                         Core (Python)                           │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   models     │  │    graph     │  │   routing    │         │ │
│  │  │              │  │              │  │              │         │ │
│  │  │ - combined   │  │ - builder    │  │ - optimizer  │         │ │
│  │  │   Model      │  │              │  │              │         │ │
│  │  │ - distance   │  │              │  │              │         │ │
│  │  │ - eta        │  │              │  │              │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │    data      │  │   training   │  │    utils     │         │ │
│  │  │              │  │              │  │              │         │ │
│  │  │ - loader     │  │ - train      │  │ - feature    │         │ │
│  │  │ - processing │  │   _model     │  │   engineering│         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

Dépendances entre Packages:
───────────────────────────

frontend ──────► server (API REST)
                   │
                   ├──────► Core (HTTP/gRPC)
                   │
                   └──────► MongoDB
                            Redis

Core ──────────────► MongoDB (lecture données)
                     Fichiers (.pkl, .json)
```

---

## 9. Modèle Entité-Association (ERD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODÈLE ENTITÉ-ASSOCIATION                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│        USER          │
├──────────────────────┤
│ PK _id               │
│    firstName         │
│    lastName          │
│ UK email             │
│    password          │
│    company           │
│    avatar            │
│    role              │
│    tier              │
│ FK activeApiSettings │
│    createdAt         │
│    updatedAt         │
└──────────┬───────────┘
           │
           │ 1
           │
           │ possède
           │
           │ N
           ▼
┌──────────────────────┐
│       API_KEY        │
├──────────────────────┤
│ PK _id               │
│    name              │
│ UK key               │
│ FK userId            │
│    status            │
│    permissions[]     │
│    created           │
│    expires           │
│    lastUsed          │
└──────────┬───────────┘
           │
           │ 1
           │
           │ génère
           │
           │ N
           ▼
┌──────────────────────┐
│    REQUEST_LOG       │
├──────────────────────┤
│ PK _id               │
│ FK userId            │
│ FK apiKeyId          │
│    apiKey            │
│    apiKeyName        │
│    requestStatus     │
│    responseMessage   │
│    requestDate       │
│    creditsUsed       │
│    endpointRoute     │
│    endpointName      │
│    endpointCategory  │
│    method            │
│    requestBody       │
│    responseTime      │
│    ipAddress         │
│    userAgent         │
│    errorDetails      │
│    isSuccess         │
└──────────────────────┘

┌──────────────────────┐
│      ROAD_GRAPH      │
├──────────────────────┤
│ PK _id               │
│    version           │
│    createdAt         │
│    region            │
│    statistics        │
└──────────┬───────────┘
           │
           │ 1
           │
           │ contient
           │
           ├──────────────┬──────────────┐
           │ N            │ N            │
           ▼              ▼              │
┌──────────────────┐  ┌──────────────────┐
│      NODE        │  │      EDGE        │
├──────────────────┤  ├──────────────────┤
│    id            │  │    source        │
│    lat           │  │    target        │
│    lon           │  │    distanceMeters│
│    type          │  │    avgSpeedKmh   │
│    visitCount    │  │    travelCount   │
└──────────────────┘  │    roadType      │
                      └──────────────────┘

┌──────────────────────┐
│       ORDER          │
├──────────────────────┤
│ PK _id               │
│    pickupLocation    │
│    destination       │
│    createdAt         │
│    deliveredAt       │
│    status            │
│ FK driverId          │
│    gpsTrace[]        │
└──────────┬───────────┘
           │
           │ 1
           │
           │ génère
           │
           │ 1
           ▼
┌──────────────────────┐
│   ROUTE_HISTORY      │
├──────────────────────┤
│ PK _id               │
│ FK orderId           │
│ FK driverId          │
│    recommendedRoute  │
│    actualRoute       │
│    deviation         │
│    timestamp         │
└──────────────────────┘

┌──────────────────────┐
│ CREDIT_TRANSACTION   │
├──────────────────────┤
│ PK _id               │
│ FK userId            │
│    amount            │
│    type              │
│    description       │
│    timestamp         │
│    balance           │
└──────────────────────┘

┌──────────────────────┐
│    NOTIFICATION      │
├──────────────────────┤
│ PK _id               │
│ FK userId            │
│    title             │
│    message           │
│    type              │
│    read              │
│    createdAt         │
└──────────────────────┘

Relations:
──────────
• USER (1) ──< (N) API_KEY
• API_KEY (1) ──< (N) REQUEST_LOG
• USER (1) ──< (N) REQUEST_LOG
• ROAD_GRAPH (1) ──< (N) NODE
• ROAD_GRAPH (1) ──< (N) EDGE
• ORDER (1) ──── (1) ROUTE_HISTORY
• USER (1) ──< (N) CREDIT_TRANSACTION
• USER (1) ──< (N) NOTIFICATION
```

---

## 📊 Résumé de la Conception

### Points Clés de l'Architecture

1. **Architecture en Couches**
   - Frontend (React/TypeScript)
   - API Gateway (Express.js)
   - Services Métier (Node.js)
   - ML/AI (Python)
   - Données (MongoDB, Redis)

2. **Patterns de Conception Utilisés**
   - MVC (Model-View-Controller)
   - Repository Pattern
   - Service Layer Pattern
   - Factory Pattern (génération API Keys)
   - Strategy Pattern (algorithmes de routage)
   - Observer Pattern (notifications)

3. **Technologies Principales**
   - **Frontend**: React 18, TypeScript, Leaflet
   - **Backend**: Node.js 18, Express.js 4
   - **ML/AI**: Python 3.9, XGBoost, NetworkX
   - **Base de données**: MongoDB 6.0, Redis 7
   - **Déploiement**: Docker, NGINX

4. **Algorithmes Clés**
   - **A* (A-Star)**: Optimisation de routes
   - **DBSCAN**: Clustering de points GPS
   - **XGBoost**: Prédiction ML (distance, ETA)
   - **Haversine**: Calcul de distances géographiques

5. **Sécurité**
   - Authentification JWT
   - API Keys avec permissions
   - Rate Limiting
   - Hachage bcrypt pour mots de passe
   - HTTPS/SSL

---

## 📝 Notes pour Présentation Académique

### Diagrammes Recommandés pour Soutenance

1. **Diagramme de Cas d'Utilisation** (Section 1)
   - Montre les acteurs et leurs interactions
   - Facile à comprendre pour un jury

2. **Diagramme de Classes** (Section 2)
   - Démontre la conception orientée objet
   - Montre les relations entre entités

3. **Diagramme de Séquence** (Section 3.1)
   - Explique le flux d'optimisation de route
   - Montre l'interaction entre composants

4. **Diagramme de Composants** (Section 5)
   - Vue d'ensemble de l'architecture
   - Montre la séparation des responsabilités

5. **Diagramme de Déploiement** (Section 6)
   - Infrastructure technique
   - Scalabilité et haute disponibilité

### Justifications Techniques

- **Choix de MongoDB**: NoSQL flexible pour données géospatiales
- **Choix de Python pour ML**: Écosystème riche (XGBoost, NetworkX)
- **Architecture Microservices**: Scalabilité et maintenabilité
- **A* Algorithm**: Optimal pour pathfinding avec heuristique
- **DBSCAN Clustering**: Adapté aux données géospatiales

---

**Document créé le**: 15 Mars 2026  
**Version**: 1.0  
**Statut**: Complet et prêt pour présentation académique
