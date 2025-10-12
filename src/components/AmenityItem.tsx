import type { Amenity } from '@/models/types';
import { Badge } from '@/components/ui/badge';
import { bottleBaby, diaper, faucet, towelFolded } from '@lucide/lab';
import BabyChangingStationIcon from '@mui/icons-material/BabyChangingStation';
import { Coffee, Icon, Plug, Snowflake, Sofa, Trash2, Wifi, XCircle } from 'lucide-react';
import React from 'react';

type AmenityItemProps = {
  amenity: Amenity;
  quantity: number;
};

const AmenityItem: React.FC<AmenityItemProps> = ({ amenity, quantity }) => {
  const getAmenityIcon = (amenityName: string) => {
    switch (amenityName.toLowerCase()) {
      case 'sink':
        return <Icon className="w-5 h-5 text-gray-600" iconNode={faucet} />;
      case 'hot water dispenser':
        return <Coffee className="w-5 h-5 text-gray-600" />;
      case 'cold water dispenser':
        return <Snowflake className="w-5 h-5 text-gray-500" />;
      case 'diaper changing station':
        return <BabyChangingStationIcon className="w-5 h-5 text-gray-600" />;
      case 'diaper dispenser':
        return <Icon className="w-5 h-5 text-gray-600" iconNode={diaper} />;
      case 'bed linen dispenser':
        return <Icon className="w-5 h-5 text-gray-600" iconNode={towelFolded} />;
      case 'wifi':
        return <Wifi className="w-5 h-5 text-gray-600" />;
      case 'trash bin':
        return <Trash2 className="w-5 h-5 text-gray-600" />;
      case 'electrical outlet':
        return <Plug className="w-5 h-5 text-gray-600" />;
      case 'lactation room':
        return <Icon className="w-5 h-5 text-gray-600" iconNode={bottleBaby} />;
      case 'bench':
        return <Sofa className="w-5 h-5 text-gray-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <li className="flex items-center gap-2">
      {getAmenityIcon(amenity.name)}
      <span className="flex items-center gap-2">
        {amenity.name}
        {quantity > 0 && (
          <Badge variant="secondary">
            x
            {quantity}
          </Badge>
        )}
      </span>
    </li>
  );
};

export default AmenityItem;
