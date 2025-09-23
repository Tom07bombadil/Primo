# Healthcare Management System Design Guidelines

## Design Approach
**System-Based Approach**: Material Design with healthcare-focused customizations
- Clean, professional interface suitable for medical environments
- Strong visual hierarchy for critical patient data
- Accessibility-first design for healthcare compliance

## Core Design Elements

### Color Palette
**Primary Colors:**
- Light Mode: 220 100% 96% (soft blue background), 220 91% 24% (navy primary)
- Dark Mode: 220 13% 9% (dark background), 220 91% 70% (light blue primary)
- Status Colors: 142 76% 36% (success/healthy), 48 96% 53% (warning), 0 84% 60% (critical/urgent)

### Typography
- **Primary Font**: Inter via Google Fonts CDN
- **Headers**: 600-700 weight for dashboard titles and section headers
- **Body**: 400-500 weight for patient data and general content
- **Data Tables**: 400 weight, slightly condensed spacing for dense information

### Layout System
- **Spacing Units**: Tailwind classes using 2, 4, 6, 8, 12, 16 units
- **Grid**: 12-column responsive grid with healthcare workflow optimization
- **Containers**: Max-width boundaries with generous padding for readability

### Component Library

**Navigation:**
- Top navigation bar with role indicator (Care Coordinator/Clinical Liaison)
- Sidebar navigation for dashboard sections
- Breadcrumb navigation for patient drill-downs

**Data Tables:**
- Sortable columns with clear visual indicators
- Row hover states for better data scanning
- Status badges with color coding (green/amber/red)
- Search and filter functionality with dropdown menus

**Cards:**
- Patient information cards with clear hierarchy
- SNF facility cards showing key metrics
- Assignment cards for coordinator-to-liaison workflows

**Forms:**
- Clean input fields with proper labeling
- Dropdown selectors for facility and provider assignment
- Date/time pickers for appointment scheduling

**Actions:**
- Primary buttons for critical actions (Assign, Schedule, Complete)
- Secondary buttons for supporting actions (View Details, Edit)
- Icon buttons for quick actions (Telehealth links, Status updates)

## Dashboard-Specific Design

### Care Coordinator Dashboard
- **Main View**: SNF facility grid with key metrics prominently displayed
- **Assignment Interface**: Drag-and-drop or dropdown assignment of facilities to liaisons
- **Overview Cards**: Summary statistics at dashboard top
- **Table Design**: Patient count, days since visit, facility status in structured rows

### Clinical Liaison Dashboard
- **Main View**: Patient appointment list with status indicators
- **Quick Actions**: Telehealth launch buttons, appointment status updates
- **Provider Information**: Clear display of assigned providers and contact details
- **Filtering**: By appointment date, status, and facility assignment

## Key Interactions
- **Role-Based Views**: Distinct dashboard layouts based on user role
- **Status Updates**: Visual feedback for appointment completions and assignments
- **Quick Access**: One-click telehealth launches and patient detail views
- **Assignment Flow**: Clear visual process for coordinator assignments to liaisons

## Accessibility & Compliance
- High contrast ratios for all text and interactive elements
- Keyboard navigation support for all dashboard functions
- Screen reader compatibility with proper ARIA labels
- HIPAA-compliant design patterns with secure data display

## Performance Considerations
- Lazy loading for large patient lists
- Efficient table virtualization for hundreds of records
- Optimized API calls with proper caching for facility and patient data

This design emphasizes clarity, efficiency, and compliance while maintaining a modern, professional healthcare application aesthetic.