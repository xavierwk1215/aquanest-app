# -*- coding: utf-8 -*-
import json, re

data = json.load(open("schema_v25.json", encoding="utf-8"))
species_list = data["species"]

fishlore_species = [
    ("Bala Shark","Balantiocheilos melanopterus"),("Cherry Barbs","Puntius titteya"),
    ("Gold Barb","Puntius sachsii"),("Harlequin Rasbora","Trigonostigma heteromorpha"),
    ("Rainbow Shark","Epalzeorhynchos frenatus"),("Red Tail Shark","Epalzeorhynchus bicolor"),
    ("Rosy Barb","Barbus conchonius"),("Scissor Tail Rasbora","Rasbora trilineata"),
    ("Tiger Barb","Puntius tetrazona"),("Tinfoil Barb","Barbus schwanefeldi"),
    ("White Cloud Mountain Minnow","Tanichthys albonubes"),("Zebra Danio","Danio rerio"),
    ("Chinese Algae Eater","Gyrinocheilos aymonieri"),("Columbian Shark","Hexanematichthys seemanni"),
    ("Corydoras (generic)","Corydoras spp"),("Clown Pleco","Panaque maccus"),
    ("Corydoras trilineatus","Corydoras trilineatus"),("Glass Catfish","Kryptopterus Minor"),
    ("Gold Nugget Pleco","Baryancistrus sp"),("Iridescent Shark","Pangasius hypophthalmus"),
    ("Otocinclus Catfish","Otocinclus vestitus"),("Panda Corydoras","Corydoras panda"),
    ("Peppered Corydoras","Corydoras paleatus"),("Pictus Catfish","Pimelodus pictus"),
    ("Plecostomus","Hypostomus plecostomus"),("Striped Raphael Catfish","Platydoras Costatus"),
    ("Redtail Catfish","Phractocephalus hemioliopterus"),
    ("Endlers Livebearer","Poecilia wingei"),("Guppy","Poecilia reticulata"),
    ("Mollies","Poecilia sphenops"),("Platy","Xiphophorus maculatus"),("Swordtail","Xiphophorus helleri"),
    ("Clown Loach","Botia macracantha"),("Dojo Loach","Misgurnus anguillicaudatus"),
    ("Hillstream Loach","Beaufortia kweichowensis"),("Kuhli Loach","Ancanthophthalmus Kuhlii"),
    ("YoYo Loach","Botia almorhae"),("Zebra Loach","Botia striata"),
    ("Betta","Betta splendens"),("Blue Gourami","Trichogaster trichopterus"),
    ("Dwarf Gourami","Colisa lalia"),("Giant Gourami","Osphronemus goramy"),
    ("Kissing Gourami","Helostoma temmincki"),("Paradise Fish","Macropodus opercularis"),
    ("Pearl Gourami","Trichogaster leeri"),("Sparkling Pygmy Gourami","Trichopsis Pumila"),
    ("Moonlight Gourami","Trichogaster microlepis"),
    ("Dwarf Puffer","Carinotetraodon travancoricus"),("Red Eye Puffer","Carinotetraodon lorteti"),
    ("Figure 8 Puffer","Tetraodon biocellatus"),
    ("Common Hatchetfish","Gasteropelecus sternicla"),("Marble Hatchetfish","Carnegiella strigata"),
    ("Black Skirt Tetra","Gymnocorymbus ternetzi"),("Bleeding Heart Tetra","Hyphessobrycon erythrostigma"),
    ("Buenos Aires Tetra","Hyphessobrycon anisitsi"),("Cardinal Tetra","Paracheirodon axelrodi"),
    ("Congo Tetra","Phenacogrammus interruptus"),("Diamond Tetra","Moenkhausia pittieri"),
    ("Glowlight Tetra","Hemigrammus erythrozonus"),("Green Neon Tetra","Paracheirodon simulans"),
    ("Neon Tetra","Paracheirodon innesi"),("Penguin Tetra","Thayeria boehlkei"),
    ("Piranha","Pygocentrus nattereri"),("Red Belly Pacu","Piaractus brachypomum"),
    ("Serpae Tetra","Hyphessobrycon callistus"),("Silver Dollar","Metynnis hypsauchen"),
    ("Freshwater Angelfish","Pterophyllum scalare"),("Blue Dolphin Cichlid","Cyrtocara moorii"),
    ("Cockatoo Cichlid","Apistogramma cacatuoides"),("Convict Cichlid","Archocentrus nigrofasciatus"),
    ("Demasoni Cichlid","Pseudotropheus Demasoni"),("Discus","Symphysodon aequifasciatus"),
    ("Firemouth Cichlid","Thorichthys meeki"),("Shell Dweller Cichlid","Neolamprologus multifasciatus"),
    ("Yellow Lab Cichlid","Labidochromis caeruleus"),("Zebra Cichlid","Pseudotropheus sp"),
    ("Kribensis Cichlid","Pelvicachromis pulcher"),("Oscar Fish","Astronotus spp"),
    ("Blue Ram Cichlid","Microgeophagus ramirezi"),
]

def genus_species(latin):
    parts = re.sub(r'[^a-zA-Z ]','',latin).strip().split()
    g = parts[0].lower() if len(parts)>0 else ""
    sp = parts[1].lower() if len(parts)>1 else ""
    return g, sp

our_species = [(*genus_species(s["latin"]), s) for s in species_list]

exact_matches = []       # same genus + same species epithet = safe match
genus_only = []          # same genus, different species = DO NOT auto-merge, flag for review
no_match = []

for name, latin in fishlore_species:
    g, sp = genus_species(latin)
    found_exact = None
    same_genus_diff = []
    for og, osp, s in our_species:
        if g == og:
            if sp and osp and sp == osp:
                found_exact = s
            elif sp != osp:
                same_genus_diff.append(s)
    if found_exact:
        exact_matches.append((name, latin, found_exact["id"], found_exact["name"]))
    elif same_genus_diff:
        genus_only.append((name, latin, [(s["id"], s["name"], s["latin"]) for s in same_genus_diff]))
    else:
        no_match.append((name, latin))

print(f"=== 정확 매칭(같은 속+같은 종) {len(exact_matches)}건 — 검증 대상 ===")
for m in exact_matches: print(" -", m[0], m[1], "->", m[3])

print(f"\n=== 같은 속, 다른 종 (자동 병합 안 함, 수동 확인 필요) {len(genus_only)}건 ===")
for m in genus_only: print(" -", m[0], m[1], "vs 저희DB:", m[2])

print(f"\n=== 매칭 없음 (저희 DB에 없는 종, 추가 후보) {len(no_match)}건 ===")
for m in no_match: print(" -", m[0], m[1])
